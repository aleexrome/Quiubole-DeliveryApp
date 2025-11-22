// ==========================================
// DEEP LINKING CONFIGURATION
// ==========================================

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';

// URL Schemes para la app
// - quiubole:// - Custom URL scheme
// - https://quiubole.mx - Universal links
// - https://app.quiubole.mx - Universal links

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<any> = {
  prefixes: [
    prefix,
    'quiubole://',
    'https://quiubole.mx',
    'https://app.quiubole.mx',
  ],
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',

      // Main app
      MainTabs: {
        screens: {
          Home: 'home',
          Search: 'search',
          Orders: 'orders',
          Profile: 'profile',
        },
      },

      // Customer screens
      RestaurantDetail: {
        path: 'restaurant/:restaurantId',
        parse: {
          restaurantId: (restaurantId: string) => restaurantId,
        },
      },
      Cart: 'cart',
      Checkout: 'checkout',
      OrderTracking: {
        path: 'order/:orderId/track',
        parse: {
          orderId: (orderId: string) => orderId,
        },
      },
      RateOrder: {
        path: 'order/:orderId/rate',
        parse: {
          orderId: (orderId: string) => orderId,
        },
      },

      // Features
      Favorites: 'favorites',
      QuiuPoints: 'quiupoints',
      GroupOrder: {
        path: 'group/:code',
        parse: {
          code: (code: string) => code.toUpperCase(),
        },
      },
      ScheduleOrder: 'schedule',
      SurpriseMe: 'surprise',
      Stories: {
        path: 'stories/:restaurantIndex?',
        parse: {
          restaurantIndex: (index: string) => parseInt(index, 10) || 0,
        },
      },
      LiveChat: {
        path: 'support/:orderId?',
        parse: {
          orderId: (orderId: string) => orderId || undefined,
        },
      },

      // Promos
      Promo: {
        path: 'promo/:promoCode',
        parse: {
          promoCode: (code: string) => code.toUpperCase(),
        },
      },

      // Legal
      Terms: 'terms',
      Privacy: 'privacy',

      // Chatbot
      Chatbot: 'chatbot',
    },
  },
};

// Helper para crear URLs compartibles
export const createShareableUrl = {
  restaurant: (restaurantId: string) =>
    `https://quiubole.mx/restaurant/${restaurantId}`,

  groupOrder: (code: string) =>
    `https://quiubole.mx/group/${code}`,

  promo: (promoCode: string) =>
    `https://quiubole.mx/promo/${promoCode}`,

  orderTracking: (orderId: string) =>
    `https://quiubole.mx/order/${orderId}/track`,

  referral: (referralCode: string) =>
    `https://quiubole.mx/invite/${referralCode}`,
};

// Hook para manejar deep links entrantes
export const handleDeepLink = (url: string): { screen: string; params?: object } | null => {
  try {
    const { hostname, path, queryParams } = Linking.parse(url);

    // Manejar diferentes tipos de deep links
    if (path?.startsWith('restaurant/')) {
      const restaurantId = path.replace('restaurant/', '');
      return { screen: 'RestaurantDetail', params: { restaurantId } };
    }

    if (path?.startsWith('group/')) {
      const code = path.replace('group/', '');
      return { screen: 'GroupOrder', params: { code } };
    }

    if (path?.startsWith('promo/')) {
      const promoCode = path.replace('promo/', '');
      return { screen: 'Cart', params: { promoCode } };
    }

    if (path?.startsWith('order/')) {
      const parts = path.split('/');
      const orderId = parts[1];
      if (parts[2] === 'track') {
        return { screen: 'OrderTracking', params: { orderId } };
      }
      if (parts[2] === 'rate') {
        return { screen: 'RateOrder', params: { orderId } };
      }
    }

    if (path?.startsWith('invite/')) {
      const referralCode = path.replace('invite/', '');
      return { screen: 'Register', params: { referralCode } };
    }

    return null;
  } catch {
    return null;
  }
};

// Configuracion para share intents (recibir contenido compartido)
export const shareIntentConfig = {
  // Manejar imagenes compartidas (para reviews)
  handleSharedImage: (imageUri: string) => {
    return { screen: 'RateOrder', params: { sharedImage: imageUri } };
  },

  // Manejar texto compartido (para buscar)
  handleSharedText: (text: string) => {
    return { screen: 'Search', params: { query: text } };
  },
};

// Generar QR code data para restaurantes
export const generateQRData = {
  restaurant: (restaurantId: string, tableNumber?: string) => {
    const baseUrl = `quiubole://restaurant/${restaurantId}`;
    return tableNumber ? `${baseUrl}?table=${tableNumber}` : baseUrl;
  },

  promo: (promoCode: string) => `quiubole://promo/${promoCode}`,

  groupOrder: (code: string) => `quiubole://group/${code}`,
};
