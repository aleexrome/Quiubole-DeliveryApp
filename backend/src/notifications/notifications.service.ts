// ==========================================
// NOTIFICATIONS SERVICE - Firebase Push
// ==========================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';

// Interface para tokens de dispositivos
interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de notificaciones
export type NotificationType =
  | 'new_order'           // Restaurante: nuevo pedido
  | 'order_accepted'      // Cliente: restaurante aceptó
  | 'order_preparing'     // Cliente: preparando pedido
  | 'order_ready'         // Repartidor: pedido listo para recoger
  | 'driver_assigned'     // Cliente: repartidor asignado
  | 'driver_picked_up'    // Cliente: repartidor recogió pedido
  | 'driver_nearby'       // Cliente: repartidor cerca
  | 'order_delivered'     // Cliente: pedido entregado
  | 'order_cancelled'     // Todos: pedido cancelado
  | 'new_delivery_available' // Repartidor: pedido disponible
  | 'payment_received'    // Restaurante: pago recibido
  | 'promotion'           // Cliente: promoción
  | 'rating_received'     // Restaurante/Repartidor: nueva calificación
  | 'account_approved'    // Restaurante/Repartidor: cuenta aprobada
  | 'settlement_reminder' // Repartidor: recordatorio de liquidación
  | 'chat_message';       // Todos: mensaje de chat

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  // En producción esto sería una entidad TypeORM
  private deviceTokens: Map<string, DeviceToken[]> = new Map();

  onModuleInit() {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Inicializar Firebase Admin SDK
      // En producción, usa variables de entorno o archivo de credenciales
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : {
            // Credenciales de desarrollo - reemplazar en producción
            projectId: process.env.FIREBASE_PROJECT_ID || 'quiubole-app',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          };

      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
        this.logger.log('Firebase Admin SDK initialized successfully');
      } else {
        this.firebaseApp = admin.apps[0]!;
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
      // En desarrollo, continuar sin Firebase
      this.logger.warn('Running without Firebase - notifications will be logged only');
    }
  }

  // ==========================================
  // REGISTRO DE TOKENS
  // ==========================================

  async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web',
  ) {
    // Verificar si el token ya existe para este usuario
    const userTokens = this.deviceTokens.get(userId) || [];
    const existingToken = userTokens.find((t) => t.token === token);

    if (existingToken) {
      existingToken.updatedAt = new Date();
      return { success: true, message: 'Token actualizado' };
    }

    // Agregar nuevo token
    const newToken: DeviceToken = {
      id: `${Date.now()}`,
      userId,
      token,
      platform,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userTokens.push(newToken);
    this.deviceTokens.set(userId, userTokens);

    this.logger.log(`Device token registered for user ${userId}`);
    return { success: true, message: 'Token registrado' };
  }

  async removeDeviceToken(userId: string, token: string) {
    const userTokens = this.deviceTokens.get(userId) || [];
    const filteredTokens = userTokens.filter((t) => t.token !== token);
    this.deviceTokens.set(userId, filteredTokens);

    return { success: true };
  }

  // ==========================================
  // ENVÍO DE NOTIFICACIONES
  // ==========================================

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    const userTokens = this.deviceTokens.get(userId) || [];

    if (userTokens.length === 0) {
      this.logger.warn(`No tokens found for user ${userId}`);
      return { success: false, message: 'No hay tokens registrados' };
    }

    const tokens = userTokens.map((t) => t.token);
    return this.sendToTokens(tokens, { type: 'general' as NotificationType, title, body, data });
  }

  async sendToRestaurant(
    restaurantId: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    // En producción, buscar el ownerId del restaurante
    // const restaurant = await this.restaurantsRepository.findOne({ where: { id: restaurantId } });
    // return this.sendToUser(restaurant.ownerId, title, body, data);

    this.logger.log(`[Restaurant ${restaurantId}] ${title}: ${body}`);
    return { success: true };
  }

  async sendToDriver(
    driverId: string,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    return this.sendToUser(driverId, title, body, data);
  }

  async sendToMultipleUsers(
    userIds: string[],
    title: string,
    body: string,
    data: Record<string, string> = {},
  ) {
    const allTokens: string[] = [];

    for (const userId of userIds) {
      const userTokens = this.deviceTokens.get(userId) || [];
      allTokens.push(...userTokens.map((t) => t.token));
    }

    if (allTokens.length === 0) {
      return { success: false, message: 'No hay tokens registrados' };
    }

    return this.sendToTokens(allTokens, { type: 'general' as NotificationType, title, body, data });
  }

  private async sendToTokens(tokens: string[], payload: NotificationPayload) {
    if (!this.firebaseApp) {
      // Sin Firebase, solo loguear
      this.logger.log(`[NOTIFICATION] ${payload.title}: ${payload.body}`);
      this.logger.log(`[NOTIFICATION] Would send to ${tokens.length} devices`);
      return { success: true, message: 'Notificación simulada (Firebase no configurado)' };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: {
          ...payload.data,
          type: payload.type,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high',
          notification: {
            sound: payload.sound || 'default',
            channelId: 'quiubole_orders',
            icon: 'notification_icon',
            color: '#FF6B35',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: payload.sound || 'default',
              badge: payload.badge,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      this.logger.log(
        `Notifications sent: ${response.successCount} success, ${response.failureCount} failed`,
      );

      // Limpiar tokens inválidos
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          await this.cleanupInvalidTokens(invalidTokens);
        }
      }

      return {
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
      };
    } catch (error) {
      this.logger.error('Error sending notifications:', error);
      return { success: false, error: error.message };
    }
  }

  private async cleanupInvalidTokens(invalidTokens: string[]) {
    for (const [userId, tokens] of this.deviceTokens.entries()) {
      const validTokens = tokens.filter((t) => !invalidTokens.includes(t.token));
      this.deviceTokens.set(userId, validTokens);
    }
    this.logger.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
  }

  // ==========================================
  // NOTIFICACIONES ESPECÍFICAS DEL NEGOCIO
  // ==========================================

  // Nuevo pedido para restaurante
  async notifyNewOrder(restaurantOwnerId: string, order: any) {
    return this.sendToUser(restaurantOwnerId, '¡Nuevo Pedido!', `Pedido #${order.orderNumber} - $${order.total.toFixed(2)}`, {
      type: 'new_order',
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total.toString(),
    });
  }

  // Pedido aceptado por restaurante
  async notifyOrderAccepted(customerId: string, order: any) {
    return this.sendToUser(
      customerId,
      'Pedido Aceptado',
      `${order.restaurant.name} está preparando tu pedido`,
      {
        type: 'order_accepted',
        orderId: order.id,
      },
    );
  }

  // Pedido listo para recoger
  async notifyOrderReady(driverId: string, order: any) {
    return this.sendToUser(
      driverId,
      'Pedido Listo',
      `El pedido #${order.orderNumber} está listo para recoger en ${order.restaurant.name}`,
      {
        type: 'order_ready',
        orderId: order.id,
        restaurantName: order.restaurant.name,
        restaurantAddress: order.restaurant.address,
      },
    );
  }

  // Repartidor asignado
  async notifyDriverAssigned(customerId: string, driver: any, order: any) {
    return this.sendToUser(
      customerId,
      'Repartidor en Camino',
      `${driver.name} recogerá tu pedido`,
      {
        type: 'driver_assigned',
        orderId: order.id,
        driverId: driver.id,
        driverName: driver.name,
        driverPhoto: driver.photo || '',
      },
    );
  }

  // Repartidor recogió el pedido
  async notifyDriverPickedUp(customerId: string, order: any) {
    return this.sendToUser(
      customerId,
      'Pedido Recogido',
      'Tu pedido va en camino',
      {
        type: 'driver_picked_up',
        orderId: order.id,
      },
    );
  }

  // Repartidor cerca
  async notifyDriverNearby(customerId: string, order: any) {
    return this.sendToUser(
      customerId,
      'Repartidor Cerca',
      'Tu pedido está a punto de llegar',
      {
        type: 'driver_nearby',
        orderId: order.id,
      },
    );
  }

  // Pedido entregado
  async notifyOrderDelivered(customerId: string, order: any) {
    return this.sendToUser(
      customerId,
      '¡Pedido Entregado!',
      '¡Buen provecho! No olvides calificar tu experiencia',
      {
        type: 'order_delivered',
        orderId: order.id,
      },
    );
  }

  // Pedido cancelado
  async notifyOrderCancelled(
    userId: string,
    order: any,
    reason: string,
    role: 'customer' | 'restaurant' | 'driver',
  ) {
    const messages = {
      customer: `Tu pedido #${order.orderNumber} ha sido cancelado. ${reason}`,
      restaurant: `El pedido #${order.orderNumber} ha sido cancelado por el cliente.`,
      driver: `La entrega #${order.orderNumber} ha sido cancelada.`,
    };

    return this.sendToUser(userId, 'Pedido Cancelado', messages[role], {
      type: 'order_cancelled',
      orderId: order.id,
      reason,
    });
  }

  // Nuevo pedido disponible para repartidores (broadcast)
  async broadcastNewDelivery(driverIds: string[], order: any) {
    return this.sendToMultipleUsers(
      driverIds,
      '¡Nueva Entrega Disponible!',
      `${order.restaurant.name} → ${order.deliveryAddress.neighborhood} - $${order.deliveryFee.toFixed(2)}`,
      {
        type: 'new_delivery_available',
        orderId: order.id,
        restaurantName: order.restaurant.name,
        deliveryFee: order.deliveryFee.toString(),
        distance: order.distance?.toString() || '0',
      },
    );
  }

  // Pago recibido (para restaurante)
  async notifyPaymentReceived(restaurantOwnerId: string, amount: number) {
    return this.sendToUser(
      restaurantOwnerId,
      'Pago Recibido',
      `Se ha depositado $${amount.toFixed(2)} a tu cuenta`,
      {
        type: 'payment_received',
        amount: amount.toString(),
      },
    );
  }

  // Promoción
  async sendPromotion(userIds: string[], title: string, message: string, promoCode?: string) {
    return this.sendToMultipleUsers(userIds, title, message, {
      type: 'promotion',
      promoCode: promoCode || '',
    });
  }

  // Nueva calificación recibida
  async notifyNewRating(userId: string, rating: number, comment: string, fromUser: string) {
    return this.sendToUser(
      userId,
      'Nueva Calificación',
      `${fromUser} te dio ${rating} estrellas: "${comment}"`,
      {
        type: 'rating_received',
        rating: rating.toString(),
      },
    );
  }

  // Cuenta aprobada
  async notifyAccountApproved(userId: string, accountType: 'restaurant' | 'driver') {
    const messages = {
      restaurant: '¡Tu restaurante ha sido aprobado! Ya puedes empezar a recibir pedidos.',
      driver: '¡Tu cuenta de repartidor ha sido aprobada! Ya puedes empezar a hacer entregas.',
    };

    return this.sendToUser(userId, '¡Cuenta Aprobada!', messages[accountType], {
      type: 'account_approved',
      accountType,
    });
  }

  // Recordatorio de liquidación
  async notifySettlementReminder(driverId: string, amount: number) {
    return this.sendToUser(
      driverId,
      'Recordatorio de Liquidación',
      `Tienes $${amount.toFixed(2)} pendientes de liquidar. Evita el bloqueo de tu cuenta.`,
      {
        type: 'settlement_reminder',
        amount: amount.toString(),
      },
    );
  }

  // Mensaje de chat
  async notifyChatMessage(userId: string, senderName: string, message: string, chatId: string) {
    return this.sendToUser(
      userId,
      `Mensaje de ${senderName}`,
      message.length > 50 ? message.substring(0, 50) + '...' : message,
      {
        type: 'chat_message',
        chatId,
        senderName,
      },
    );
  }

  // ==========================================
  // TÓPICOS (para notificaciones masivas)
  // ==========================================

  async subscribeToTopic(token: string, topic: string) {
    if (!this.firebaseApp) return { success: false };

    try {
      await admin.messaging().subscribeToTopic(token, topic);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error subscribing to topic ${topic}:`, error);
      return { success: false };
    }
  }

  async unsubscribeFromTopic(token: string, topic: string) {
    if (!this.firebaseApp) return { success: false };

    try {
      await admin.messaging().unsubscribeFromTopic(token, topic);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error unsubscribing from topic ${topic}:`, error);
      return { success: false };
    }
  }

  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    if (!this.firebaseApp) {
      this.logger.log(`[TOPIC: ${topic}] ${title}: ${body}`);
      return { success: true };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: { title, body },
        data: data || {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'quiubole_general',
          },
        },
        apns: {
          payload: {
            aps: { sound: 'default' },
          },
        },
      };

      const response = await admin.messaging().send(message);
      this.logger.log(`Message sent to topic ${topic}: ${response}`);
      return { success: true, messageId: response };
    } catch (error) {
      this.logger.error(`Error sending to topic ${topic}:`, error);
      return { success: false };
    }
  }
}
