// ==========================================
// USE NOTIFICATIONS HOOK
// ==========================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import notificationService from '../services/notifications';
import { useAuthStore } from '../store/authStore';

interface UseNotificationsOptions {
  onNewOrder?: (orderId: string) => void;
  onOrderUpdate?: (orderId: string, status: string) => void;
  onNewDelivery?: (orderId: string) => void;
  onChatMessage?: (chatId: string) => void;
  onPromotion?: (promoCode?: string) => void;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);

  const appState = useRef(AppState.currentState);
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuthStore();

  // Inicializar notificaciones
  const initialize = useCallback(async () => {
    try {
      const token = await notificationService.initialize();

      if (token) {
        setPushToken(token);
        setHasPermission(true);

        // Si el usuario está autenticado, registrar token en backend
        if (isAuthenticated) {
          await notificationService.registerTokenWithBackend();

          // Suscribir a tópicos según el rol
          if (user?.role) {
            await subscribeToRoleTopics(user.role);
          }
        }
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing notifications:', error);
      setIsInitialized(true);
    }
  }, [isAuthenticated, user?.role]);

  // Suscribir a tópicos según rol
  const subscribeToRoleTopics = async (role: string) => {
    const token = notificationService.getToken();
    if (!token) return;

    // Tópicos comunes
    await notificationService.subscribeToTopic(token, 'all_users');

    switch (role) {
      case 'customer':
        await notificationService.subscribeToTopic(token, 'customers');
        await notificationService.subscribeToTopic(token, 'promotions');
        break;
      case 'restaurant':
        await notificationService.subscribeToTopic(token, 'restaurants');
        break;
      case 'driver':
        await notificationService.subscribeToTopic(token, 'drivers');
        break;
      case 'admin':
        await notificationService.subscribeToTopic(token, 'admins');
        break;
    }
  };

  // Manejar notificación recibida
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      setLastNotification(notification);
      const data = notification.request.content.data as Record<string, string>;

      if (!data?.type) return;

      switch (data.type) {
        case 'new_order':
          options.onNewOrder?.(data.orderId);
          break;
        case 'order_accepted':
        case 'order_preparing':
        case 'driver_assigned':
        case 'driver_picked_up':
        case 'driver_nearby':
        case 'order_delivered':
        case 'order_cancelled':
          options.onOrderUpdate?.(data.orderId, data.type);
          break;
        case 'new_delivery_available':
          options.onNewDelivery?.(data.orderId);
          break;
        case 'chat_message':
          options.onChatMessage?.(data.chatId);
          break;
        case 'promotion':
          options.onPromotion?.(data.promoCode);
          break;
      }
    },
    [options],
  );

  // Manejar respuesta a notificación (usuario tocó)
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as Record<string, string>;

      if (!data?.type) return;

      // Navegar según el tipo de notificación
      switch (data.type) {
        case 'new_order':
          // @ts-ignore - navigation types
          navigation.navigate('RestaurantOrders', { orderId: data.orderId });
          break;
        case 'order_accepted':
        case 'order_preparing':
        case 'driver_assigned':
        case 'driver_picked_up':
        case 'driver_nearby':
          // @ts-ignore
          navigation.navigate('OrderTracking', { orderId: data.orderId });
          break;
        case 'order_delivered':
          // @ts-ignore
          navigation.navigate('OrderDetails', { orderId: data.orderId, showRating: true });
          break;
        case 'new_delivery_available':
          // @ts-ignore
          navigation.navigate('DriverHome');
          break;
        case 'chat_message':
          // @ts-ignore
          navigation.navigate('Chat', { chatId: data.chatId });
          break;
        case 'promotion':
          // @ts-ignore
          navigation.navigate('Promotions');
          break;
      }
    },
    [navigation],
  );

  // Efecto para inicializar
  useEffect(() => {
    initialize();

    // Cleanup
    return () => {
      notificationService.removeListeners();
    };
  }, [initialize]);

  // Efecto para configurar handlers
  useEffect(() => {
    if (!isInitialized) return;

    notificationService.setNotificationReceivedHandler(handleNotificationReceived);
    notificationService.setNotificationResponseHandler(handleNotificationResponse);
  }, [isInitialized, handleNotificationReceived, handleNotificationResponse]);

  // Efecto para manejar cambios de estado de la app
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App volvió al foreground - limpiar badge
        notificationService.clearBadge();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Efecto para registrar token cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated && pushToken) {
      notificationService.registerTokenWithBackend();
      if (user?.role) {
        subscribeToRoleTopics(user.role);
      }
    }
  }, [isAuthenticated, pushToken, user?.role]);

  // Funciones expuestas
  const requestPermission = async () => {
    const granted = await notificationService.requestPermissions();
    setHasPermission(granted);
    if (granted && !pushToken) {
      await initialize();
    }
    return granted;
  };

  const sendTestNotification = async () => {
    await notificationService.sendImmediateNotification(
      'Notificación de Prueba',
      '¡Las notificaciones funcionan correctamente!',
      { type: 'test' },
    );
  };

  const clearBadge = () => notificationService.clearBadge();

  const setBadgeCount = (count: number) => notificationService.setBadgeCount(count);

  return {
    isInitialized,
    hasPermission,
    pushToken,
    lastNotification,
    requestPermission,
    sendTestNotification,
    clearBadge,
    setBadgeCount,
  };
}

export default useNotifications;
