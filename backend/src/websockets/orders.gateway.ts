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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, { socket: Socket; userId?: string; role?: string }> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, { socket: client });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('authenticate')
  handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; role: string },
  ) {
    const clientData = this.connectedClients.get(client.id);
    if (clientData) {
      clientData.userId = data.userId;
      clientData.role = data.role;
      client.join(`user_${data.userId}`);
      client.join(`role_${data.role}`);
    }
    return { status: 'authenticated' };
  }

  @SubscribeMessage('joinOrderRoom')
  handleJoinOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.join(`order_${data.orderId}`);
    return { status: 'joined', room: `order_${data.orderId}` };
  }

  @SubscribeMessage('leaveOrderRoom')
  handleLeaveOrderRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string },
  ) {
    client.leave(`order_${data.orderId}`);
    return { status: 'left', room: `order_${data.orderId}` };
  }

  @SubscribeMessage('joinRestaurantRoom')
  handleJoinRestaurantRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { restaurantId: string },
  ) {
    client.join(`restaurant_${data.restaurantId}`);
    return { status: 'joined', room: `restaurant_${data.restaurantId}` };
  }

  @SubscribeMessage('updateDriverLocation')
  handleDriverLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: string; latitude: number; longitude: number },
  ) {
    this.server.to(`order_${data.orderId}`).emit('driverLocationUpdate', {
      orderId: data.orderId,
      latitude: data.latitude,
      longitude: data.longitude,
      timestamp: new Date(),
    });
    return { status: 'location_updated' };
  }

  notifyOrderStatusChange(orderId: string, status: string, customerId: string) {
    this.server.to(`order_${orderId}`).emit('orderStatusUpdate', { orderId, status });
    this.server.to(`user_${customerId}`).emit('orderStatusUpdate', { orderId, status });
  }

  notifyNewOrder(restaurantId: string, order: any) {
    this.server.to(`restaurant_${restaurantId}`).emit('newOrder', order);
  }

  notifyDriversNewOrder(order: any) {
    this.server.to('role_driver').emit('availableOrder', order);
  }
}
