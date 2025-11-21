// ==========================================
// CHAT GATEWAY - WebSocket para Chat en Tiempo Real
// ==========================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'driver' | 'restaurant' | 'support';
  content: string;
  type: 'text' | 'image' | 'location';
  timestamp: Date;
  read: boolean;
}

interface ChatRoom {
  id: string;
  orderId: string;
  participants: {
    id: string;
    name: string;
    role: string;
  }[];
  messages: ChatMessage[];
  createdAt: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, { socketId: string; userId: string; role: string }> = new Map();
  private chatRooms: Map<string, ChatRoom> = new Map();

  constructor(private jwtService: JwtService) {}

  // ==========================================
  // CONEXIÓN/DESCONEXIÓN
  // ==========================================

  async handleConnection(client: Socket) {
    try {
      // Obtener token del handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verificar token
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // Registrar usuario conectado
      this.connectedUsers.set(client.id, {
        socketId: client.id,
        userId: payload.sub,
        role: payload.role,
      });

      // Unir a sala personal para notificaciones directas
      client.join(`user:${payload.sub}`);

      this.logger.log(`User ${payload.sub} connected (${client.id})`);

      // Enviar confirmación
      client.emit('connected', {
        userId: payload.sub,
        message: 'Connected to chat server',
      });
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.logger.log(`User ${user.userId} disconnected`);
      this.connectedUsers.delete(client.id);
    }
  }

  // ==========================================
  // SALAS DE CHAT
  // ==========================================

  @SubscribeMessage('joinChat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; orderId?: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const chatId = data.chatId || `order:${data.orderId}`;

    // Crear sala si no existe
    if (!this.chatRooms.has(chatId)) {
      this.chatRooms.set(chatId, {
        id: chatId,
        orderId: data.orderId || '',
        participants: [],
        messages: [],
        createdAt: new Date(),
      });
    }

    // Agregar participante
    const room = this.chatRooms.get(chatId)!;
    if (!room.participants.find((p) => p.id === user.userId)) {
      room.participants.push({
        id: user.userId,
        name: '', // Se obtendría de la DB
        role: user.role,
      });
    }

    // Unir a la sala
    client.join(chatId);

    this.logger.log(`User ${user.userId} joined chat ${chatId}`);

    // Enviar historial de mensajes
    client.emit('chatHistory', {
      chatId,
      messages: room.messages.slice(-50), // Últimos 50 mensajes
    });

    // Notificar a otros participantes
    client.to(chatId).emit('userJoined', {
      chatId,
      userId: user.userId,
      role: user.role,
    });
  }

  @SubscribeMessage('leaveChat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    client.leave(data.chatId);

    this.logger.log(`User ${user.userId} left chat ${data.chatId}`);

    // Notificar a otros
    client.to(data.chatId).emit('userLeft', {
      chatId: data.chatId,
      userId: user.userId,
    });
  }

  // ==========================================
  // MENSAJES
  // ==========================================

  @SubscribeMessage('sendMessage')
  handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      chatId: string;
      content: string;
      type?: 'text' | 'image' | 'location';
    },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const room = this.chatRooms.get(data.chatId);
    if (!room) {
      client.emit('error', { message: 'Chat room not found' });
      return;
    }

    // Crear mensaje
    const message: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId: data.chatId,
      senderId: user.userId,
      senderName: '', // Se obtendría de la DB
      senderRole: user.role as any,
      content: data.content,
      type: data.type || 'text',
      timestamp: new Date(),
      read: false,
    };

    // Guardar mensaje
    room.messages.push(message);

    // Enviar a todos en la sala (incluido el remitente)
    this.server.to(data.chatId).emit('newMessage', message);

    this.logger.log(`Message sent in chat ${data.chatId} by user ${user.userId}`);

    // TODO: Enviar notificación push a usuarios offline
    // this.notifyOfflineUsers(data.chatId, message);

    return { success: true, messageId: message.id };
  }

  @SubscribeMessage('markAsRead')
  handleMarkAsRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; messageIds: string[] },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    const room = this.chatRooms.get(data.chatId);
    if (!room) return;

    // Marcar mensajes como leídos
    data.messageIds.forEach((msgId) => {
      const message = room.messages.find((m) => m.id === msgId);
      if (message && message.senderId !== user.userId) {
        message.read = true;
      }
    });

    // Notificar al remitente
    client.to(data.chatId).emit('messagesRead', {
      chatId: data.chatId,
      messageIds: data.messageIds,
      readBy: user.userId,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { chatId: string; isTyping: boolean },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    // Notificar a otros en la sala
    client.to(data.chatId).emit('userTyping', {
      chatId: data.chatId,
      userId: user.userId,
      isTyping: data.isTyping,
    });
  }

  // ==========================================
  // UBICACIÓN EN TIEMPO REAL (para repartidores)
  // ==========================================

  @SubscribeMessage('updateLocation')
  handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; lat: number; lng: number },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user || user.role !== 'driver') return;

    // Enviar ubicación a todos los interesados en el pedido
    this.server.to(`order:${data.orderId}`).emit('driverLocation', {
      orderId: data.orderId,
      driverId: user.userId,
      location: {
        lat: data.lat,
        lng: data.lng,
      },
      timestamp: new Date(),
    });
  }

  // ==========================================
  // ACTUALIZACIONES DE PEDIDO
  // ==========================================

  @SubscribeMessage('subscribeToOrder')
  handleSubscribeToOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const user = this.connectedUsers.get(client.id);
    if (!user) return;

    client.join(`order:${data.orderId}`);
    this.logger.log(`User ${user.userId} subscribed to order ${data.orderId}`);
  }

  @SubscribeMessage('unsubscribeFromOrder')
  handleUnsubscribeFromOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.leave(`order:${data.orderId}`);
  }

  // Método para enviar actualizaciones de pedido (llamado desde otros servicios)
  sendOrderUpdate(orderId: string, update: any) {
    this.server.to(`order:${orderId}`).emit('orderUpdate', {
      orderId,
      ...update,
      timestamp: new Date(),
    });
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  // Enviar mensaje directo a un usuario
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Verificar si usuario está conectado
  isUserOnline(userId: string): boolean {
    for (const [, user] of this.connectedUsers) {
      if (user.userId === userId) return true;
    }
    return false;
  }

  // Obtener usuarios conectados en una sala
  getUsersInRoom(chatId: string): string[] {
    const room = this.chatRooms.get(chatId);
    if (!room) return [];

    return room.participants.map((p) => p.id).filter((id) => this.isUserOnline(id));
  }
}
