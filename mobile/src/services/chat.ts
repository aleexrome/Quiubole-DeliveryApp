// ==========================================
// CHAT SERVICE - Mobile (Socket.IO)
// ==========================================

import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos
export interface ChatMessage {
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

export interface DriverLocation {
  orderId: string;
  driverId: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
}

export interface OrderUpdate {
  orderId: string;
  status: string;
  message?: string;
  timestamp: Date;
}

type ChatEventCallback = (data: any) => void;

// URL del servidor (cambiar en producción)
const SOCKET_URL = 'http://192.168.1.124:3001';

class ChatService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<ChatEventCallback>> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // ==========================================
  // CONEXIÓN
  // ==========================================

  async connect(): Promise<boolean> {
    if (this.socket?.connected) {
      return true;
    }

    try {
      const token = await AsyncStorage.getItem('auth-token');
      if (!token) {
        console.log('No auth token available for chat');
        return false;
      }

      this.socket = io(`${SOCKET_URL}/chat`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        timeout: 10000,
      });

      this.setupListeners();

      return new Promise((resolve) => {
        this.socket!.on('connected', () => {
          console.log('Chat connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        });

        this.socket!.on('connect_error', (error) => {
          console.error('Chat connection error:', error);
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            resolve(false);
          }
        });

        // Timeout después de 10 segundos
        setTimeout(() => {
          if (!this.isConnected) {
            resolve(false);
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error connecting to chat:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  private setupListeners(): void {
    if (!this.socket) return;

    // Eventos de conexión
    this.socket.on('disconnect', () => {
      console.log('Chat disconnected');
      this.isConnected = false;
      this.emit('disconnected', {});
    });

    this.socket.on('reconnect', () => {
      console.log('Chat reconnected');
      this.isConnected = true;
      this.emit('reconnected', {});
    });

    this.socket.on('error', (error) => {
      console.error('Chat error:', error);
      this.emit('error', error);
    });

    // Eventos de chat
    this.socket.on('newMessage', (message: ChatMessage) => {
      this.emit('newMessage', message);
    });

    this.socket.on('chatHistory', (data: { chatId: string; messages: ChatMessage[] }) => {
      this.emit('chatHistory', data);
    });

    this.socket.on('userJoined', (data: { chatId: string; userId: string; role: string }) => {
      this.emit('userJoined', data);
    });

    this.socket.on('userLeft', (data: { chatId: string; userId: string }) => {
      this.emit('userLeft', data);
    });

    this.socket.on('userTyping', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      this.emit('userTyping', data);
    });

    this.socket.on('messagesRead', (data: { chatId: string; messageIds: string[]; readBy: string }) => {
      this.emit('messagesRead', data);
    });

    // Eventos de ubicación
    this.socket.on('driverLocation', (data: DriverLocation) => {
      this.emit('driverLocation', data);
    });

    // Eventos de pedido
    this.socket.on('orderUpdate', (data: OrderUpdate) => {
      this.emit('orderUpdate', data);
    });
  }

  // ==========================================
  // SALAS DE CHAT
  // ==========================================

  joinChat(chatId: string, orderId?: string): void {
    if (!this.socket?.connected) {
      console.warn('Cannot join chat: not connected');
      return;
    }

    this.socket.emit('joinChat', { chatId, orderId });
  }

  leaveChat(chatId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('leaveChat', { chatId });
  }

  // ==========================================
  // MENSAJES
  // ==========================================

  sendMessage(chatId: string, content: string, type: 'text' | 'image' | 'location' = 'text'): void {
    if (!this.socket?.connected) {
      console.warn('Cannot send message: not connected');
      return;
    }

    this.socket.emit('sendMessage', { chatId, content, type });
  }

  markAsRead(chatId: string, messageIds: string[]): void {
    if (!this.socket?.connected) return;

    this.socket.emit('markAsRead', { chatId, messageIds });
  }

  sendTypingStatus(chatId: string, isTyping: boolean): void {
    if (!this.socket?.connected) return;

    this.socket.emit('typing', { chatId, isTyping });
  }

  // ==========================================
  // UBICACIÓN
  // ==========================================

  updateDriverLocation(orderId: string, lat: number, lng: number): void {
    if (!this.socket?.connected) return;

    this.socket.emit('updateLocation', { orderId, lat, lng });
  }

  // ==========================================
  // PEDIDOS
  // ==========================================

  subscribeToOrder(orderId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('subscribeToOrder', { orderId });
  }

  unsubscribeFromOrder(orderId: string): void {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribeFromOrder', { orderId });
  }

  // ==========================================
  // EVENT EMITTER
  // ==========================================

  on(event: string, callback: ChatEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Retornar función para desuscribirse
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: ChatEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in chat event handler for ${event}:`, error);
      }
    });
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getChatIdForOrder(orderId: string): string {
    return `order:${orderId}`;
  }
}

export const chatService = new ChatService();
export default chatService;
