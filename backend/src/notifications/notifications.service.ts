import { Injectable } from '@nestjs/common';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  // In-memory storage for demo; use database in production
  private notifications: Notification[] = [];

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ) {
    // In production, integrate with Firebase Cloud Messaging or Expo Push
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      body,
      type: data?.type || 'general',
      data,
      read: false,
      createdAt: new Date(),
    };

    this.notifications.push(notification);

    console.log(`[PUSH] To: ${userId}, Title: ${title}, Body: ${body}`);

    return notification;
  }

  async getUserNotifications(userId: string) {
    return this.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId && n.userId === userId,
    );

    if (notification) {
      notification.read = true;
    }

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    this.notifications
      .filter((n) => n.userId === userId)
      .forEach((n) => (n.read = true));

    return { success: true };
  }

  async getUnreadCount(userId: string) {
    const count = this.notifications.filter(
      (n) => n.userId === userId && !n.read,
    ).length;

    return { count };
  }

  // Order-specific notifications
  async notifyOrderConfirmed(userId: string, orderNumber: string) {
    return this.sendPushNotification(
      userId,
      '¡Pedido Confirmado!',
      `Tu pedido ${orderNumber} ha sido confirmado por el restaurante.`,
      { type: 'order_confirmed', orderNumber },
    );
  }

  async notifyOrderReady(userId: string, orderNumber: string) {
    return this.sendPushNotification(
      userId,
      'Pedido Listo',
      `Tu pedido ${orderNumber} está listo y esperando al repartidor.`,
      { type: 'order_ready', orderNumber },
    );
  }

  async notifyDriverAssigned(
    userId: string,
    orderNumber: string,
    driverName: string,
  ) {
    return this.sendPushNotification(
      userId,
      'Repartidor Asignado',
      `${driverName} recogerá tu pedido ${orderNumber}.`,
      { type: 'driver_assigned', orderNumber, driverName },
    );
  }

  async notifyOrderPickedUp(userId: string, orderNumber: string) {
    return this.sendPushNotification(
      userId,
      '¡En Camino!',
      `Tu pedido ${orderNumber} va en camino a tu dirección.`,
      { type: 'order_picked_up', orderNumber },
    );
  }

  async notifyOrderDelivered(userId: string, orderNumber: string) {
    return this.sendPushNotification(
      userId,
      '¡Pedido Entregado!',
      `Tu pedido ${orderNumber} ha sido entregado. ¡Buen provecho!`,
      { type: 'order_delivered', orderNumber },
    );
  }

  // Driver notifications
  async notifyNewOrderAvailable(driverId: string, restaurantName: string) {
    return this.sendPushNotification(
      driverId,
      'Nuevo Pedido Disponible',
      `Hay un nuevo pedido listo en ${restaurantName}.`,
      { type: 'new_order_available', restaurantName },
    );
  }

  // Restaurant notifications
  async notifyNewOrder(ownerId: string, orderNumber: string) {
    return this.sendPushNotification(
      ownerId,
      '¡Nuevo Pedido!',
      `Has recibido un nuevo pedido: ${orderNumber}`,
      { type: 'new_order', orderNumber },
    );
  }
}
