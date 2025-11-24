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
import { JwtService } from '@nestjs/jwt';

interface ChatMessage {
  id: string;
  orderId: string;
  senderId: string;
  senderType: 'customer' | 'driver' | 'restaurant';
  message: string;
  timestamp: Date;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, Socket> = new Map();
  private orderRooms: Map<string, Set<string>> = new Map();
  private chatHistory: Map<string, ChatMessage[]> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.data.userType = payload.role;

      this.connectedUsers.set(payload.sub, client);
      console.log(`User ${payload.sub} connected to chat`);
    } catch (error) {
      console.error('Chat connection error:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.connectedUsers.delete(client.data.userId);
      console.log(`User ${client.data.userId} disconnected from chat`);
    }
  }

  @SubscribeMessage('joinOrderChat')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const roomName = `order_${data.orderId}`;
    client.join(roomName);

    if (!this.orderRooms.has(data.orderId)) {
      this.orderRooms.set(data.orderId, new Set());
    }
    this.orderRooms.get(data.orderId)?.add(client.data.userId);

    // Send chat history
    const history = this.chatHistory.get(data.orderId) || [];
    client.emit('chatHistory', history);

    return { success: true, room: roomName };
  }

  @SubscribeMessage('leaveOrderChat')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    const roomName = `order_${data.orderId}`;
    client.leave(roomName);
    this.orderRooms.get(data.orderId)?.delete(client.data.userId);

    return { success: true };
  }

  @SubscribeMessage('sendMessage')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; message: string },
  ) {
    const roomName = `order_${data.orderId}`;

    const chatMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      orderId: data.orderId,
      senderId: client.data.userId,
      senderType: client.data.userType,
      message: data.message,
      timestamp: new Date(),
    };

    // Store in history
    if (!this.chatHistory.has(data.orderId)) {
      this.chatHistory.set(data.orderId, []);
    }
    this.chatHistory.get(data.orderId)?.push(chatMessage);

    // Broadcast to room
    this.server.to(roomName).emit('newMessage', chatMessage);

    return { success: true, messageId: chatMessage.id };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; isTyping: boolean },
  ) {
    const roomName = `order_${data.orderId}`;
    client.to(roomName).emit('userTyping', {
      userId: client.data.userId,
      isTyping: data.isTyping,
    });
  }

  // Server-initiated notifications
  sendOrderUpdate(orderId: string, status: string, message: string) {
    const roomName = `order_${orderId}`;
    this.server.to(roomName).emit('orderUpdate', {
      orderId,
      status,
      message,
      timestamp: new Date(),
    });
  }

  sendDriverLocation(orderId: string, location: { lat: number; lng: number }) {
    const roomName = `order_${orderId}`;
    this.server.to(roomName).emit('driverLocation', {
      orderId,
      location,
      timestamp: new Date(),
    });
  }
}
