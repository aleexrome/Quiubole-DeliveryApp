// ==========================================
// NOTIFICATIONS SERVICE - Mobile (Expo)
// ==========================================

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Tipos de notificaciones
export type NotificationType =
  | 'new_order'
  | 'order_accepted'
  | 'order_preparing'
  | 'order_ready'
  | 'driver_assigned'
  | 'driver_picked_up'
  | 'driver_nearby'
  | 'order_delivered'
  | 'order_cancelled'
  | 'new_delivery_available'
  | 'payment_received'
  | 'promotion'
  | 'rating_received'
  | 'account_approved'
  | 'settlement_reminder'
  | 'chat_message';

interface NotificationData {
  type: NotificationType;
  orderId?: string;
  orderNumber?: string;
  restaurantName?: string;
  driverId?: string;
  driverName?: string;
  chatId?: string;
  [key: string]: string | undefined;
}

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;
  private onNotificationReceived: ((notification: Notifications.Notification) => void) | null = null;
  private onNotificationResponse: ((response: Notifications.NotificationResponse) => void) | null = null;

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  async initialize() {
    // Verificar si es dispositivo físico
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    // Solicitar permisos
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      console.log('Push notification permissions denied');
      return null;
    }

    // Obtener token
    const token = await this.getExpoPushToken();
    if (token) {
      this.pushToken = token;
      await this.saveTokenLocally(token);
    }

    // Configurar listeners
    this.setupListeners();

    // Configurar canales de Android
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    return token;
  }

  // ==========================================
  // PERMISOS
  // ==========================================

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async checkPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // ==========================================
  // TOKEN
  // ==========================================

  async getExpoPushToken(): Promise<string | null> {
    try {
      // Para Expo SDK 52+
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId || undefined,
      });

      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private async saveTokenLocally(token: string) {
    try {
      await AsyncStorage.setItem('pushToken', token);
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  async getLocalToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('pushToken');
    } catch (error) {
      return null;
    }
  }

  // ==========================================
  // REGISTRO CON BACKEND
  // ==========================================

  async registerTokenWithBackend(): Promise<boolean> {
    if (!this.pushToken) {
      console.log('No push token available');
      return false;
    }

    try {
      await api.notifications.registerToken(
        this.pushToken,
        Platform.OS as 'ios' | 'android',
      );
      console.log('Push token registered with backend');
      return true;
    } catch (error) {
      console.error('Error registering push token:', error);
      return false;
    }
  }

  async unregisterTokenFromBackend(): Promise<boolean> {
    const token = this.pushToken || (await this.getLocalToken());
    if (!token) return false;

    try {
      await api.notifications.removeToken(token);
      await AsyncStorage.removeItem('pushToken');
      this.pushToken = null;
      return true;
    } catch (error) {
      console.error('Error unregistering push token:', error);
      return false;
    }
  }

  // ==========================================
  // LISTENERS
  // ==========================================

  private setupListeners() {
    // Listener para notificaciones recibidas (app en foreground)
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (this.onNotificationReceived) {
          this.onNotificationReceived(notification);
        }
      },
    );

    // Listener para respuestas a notificaciones (usuario tocó la notificación)
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        if (this.onNotificationResponse) {
          this.onNotificationResponse(response);
        }
        this.handleNotificationNavigation(response);
      },
    );
  }

  setNotificationReceivedHandler(handler: (notification: Notifications.Notification) => void) {
    this.onNotificationReceived = handler;
  }

  setNotificationResponseHandler(handler: (response: Notifications.NotificationResponse) => void) {
    this.onNotificationResponse = handler;
  }

  removeListeners() {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }

  // ==========================================
  // NAVEGACIÓN POR TIPO DE NOTIFICACIÓN
  // ==========================================

  private handleNotificationNavigation(response: Notifications.NotificationResponse) {
    const data = response.notification.request.content.data as NotificationData;

    if (!data || !data.type) return;

    // Aquí se manejaría la navegación según el tipo
    // Esto se conectaría con el navigation service
    console.log('Navigate based on notification type:', data.type);

    switch (data.type) {
      case 'new_order':
        // Navegar a pantalla de pedidos del restaurante
        // navigation.navigate('RestaurantOrders', { orderId: data.orderId });
        break;

      case 'order_accepted':
      case 'order_preparing':
      case 'driver_assigned':
      case 'driver_picked_up':
      case 'driver_nearby':
      case 'order_delivered':
        // Navegar a tracking del pedido
        // navigation.navigate('OrderTracking', { orderId: data.orderId });
        break;

      case 'new_delivery_available':
        // Navegar a pantalla de pedidos disponibles
        // navigation.navigate('DriverHome');
        break;

      case 'chat_message':
        // Navegar al chat
        // navigation.navigate('Chat', { chatId: data.chatId });
        break;

      case 'promotion':
        // Navegar a promociones
        // navigation.navigate('Promotions');
        break;

      default:
        console.log('Unknown notification type:', data.type);
    }
  }

  // ==========================================
  // CANALES DE ANDROID
  // ==========================================

  private async setupAndroidChannels() {
    // Canal principal para pedidos (alta prioridad). LED amarillo brand.
    await Notifications.setNotificationChannelAsync('devolon_orders', {
      name: 'Pedidos',
      description: 'Notificaciones de pedidos y entregas',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFC20E', // Pantone 123 C — colors.primary del theme
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });

    // Canal para promociones (prioridad media)
    await Notifications.setNotificationChannelAsync('devolon_promotions', {
      name: 'Promociones',
      description: 'Ofertas y promociones',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });

    // Canal para chat (prioridad alta)
    await Notifications.setNotificationChannelAsync('devolon_chat', {
      name: 'Mensajes',
      description: 'Mensajes del chat',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    // Canal general
    await Notifications.setNotificationChannelAsync('devolon_general', {
      name: 'General',
      description: 'Notificaciones generales',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // ==========================================
  // NOTIFICACIONES LOCALES (para testing)
  // ==========================================

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
    seconds: number = 1,
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
      },
    });
  }

  async sendImmediateNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
      },
      trigger: null, // Inmediato
    });
  }

  // ==========================================
  // BADGES
  // ==========================================

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async clearBadge() {
    await Notifications.setBadgeCountAsync(0);
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  }

  getToken(): string | null {
    return this.pushToken;
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();
export default notificationService;
