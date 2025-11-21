// ==========================================
// CONFIGURACION DE API
// ==========================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Restaurant, Product, Order, OrderStatus, DriverStatus } from '../types';

// Cambiar esta URL a tu servidor
const API_BASE_URL = 'http://192.168.1.124:3001/api';

// Crear instancia de axios
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expirado, limpiar sesion
      AsyncStorage.removeItem('auth-storage');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTH API
// ==========================================
export const authApi = {
  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    await AsyncStorage.setItem('auth-token', response.data.token);
    return response.data;
  },

  register: async (data: {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: string;
  }) => {
    const response = await api.post('/auth/register', data);
    await AsyncStorage.setItem('auth-token', response.data.token);
    return response.data;
  },

  verifyEmail: async (code: string) => {
    const response = await api.post('/auth/verify-email', { code });
    return response.data;
  },

  resendVerificationCode: async () => {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// ==========================================
// RESTAURANTS API
// ==========================================
export const restaurantsApi = {
  getAll: async (params?: {
    category?: string;
    search?: string;
    lat?: number;
    lng?: number;
  }) => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  // Para duenos de restaurantes
  getMyRestaurant: async () => {
    const response = await api.get('/restaurants/my');
    return response.data;
  },

  updateMyRestaurant: async (data: Partial<Restaurant>) => {
    const response = await api.put('/restaurants/my', data);
    return response.data;
  },

  updateAvailability: async (isActive: boolean) => {
    const response = await api.patch('/restaurants/my/availability', { isActive });
    return response.data;
  },

  getStats: async (period: 'day' | 'week' | 'month') => {
    const response = await api.get(`/restaurants/my/stats?period=${period}`);
    return response.data;
  },
};

// ==========================================
// PRODUCTS API
// ==========================================
export const productsApi = {
  getByRestaurant: async (restaurantId: string) => {
    const response = await api.get(`/products/restaurant/${restaurantId}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Para duenos de restaurantes
  create: async (data: Partial<Product>) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Product>) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  toggleAvailability: async (id: string) => {
    const response = await api.patch(`/products/${id}/availability`);
    return response.data;
  },
};

// ==========================================
// ORDERS API
// ==========================================
export const ordersApi = {
  // Para clientes
  create: async (data: {
    restaurantId: string;
    items: { productId: string; quantity: number; options?: any[] }[];
    deliveryAddressId: string;
    paymentMethod: string;
    specialInstructions?: string;
    tip?: number;
    couponCode?: string;
  }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getMyOrders: async () => {
    const response = await api.get('/orders/my');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancel: async (id: string, reason: string) => {
    const response = await api.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Para restaurantes
  getRestaurantOrders: async (status?: OrderStatus) => {
    const params = status ? { status } : {};
    const response = await api.get('/orders/restaurant', { params });
    return response.data;
  },

  acceptOrder: async (id: string, estimatedTime: number) => {
    const response = await api.post(`/orders/${id}/accept`, { estimatedTime });
    return response.data;
  },

  rejectOrder: async (id: string, reason: string) => {
    const response = await api.post(`/orders/${id}/reject`, { reason });
    return response.data;
  },

  markPreparing: async (id: string) => {
    const response = await api.post(`/orders/${id}/preparing`);
    return response.data;
  },

  markReady: async (id: string) => {
    const response = await api.post(`/orders/${id}/ready`);
    return response.data;
  },

  // Para repartidores
  getAvailableOrders: async (lat: number, lng: number, radius: number = 5) => {
    const response = await api.get('/orders/available', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  acceptDelivery: async (orderId: string) => {
    const response = await api.post(`/orders/${orderId}/accept-delivery`);
    return response.data;
  },

  markPickedUp: async (orderId: string) => {
    const response = await api.post(`/orders/${orderId}/picked-up`);
    return response.data;
  },

  markDelivered: async (orderId: string) => {
    const response = await api.post(`/orders/${orderId}/delivered`);
    return response.data;
  },

  getDriverOrders: async () => {
    const response = await api.get('/orders/driver');
    return response.data;
  },

  getActiveDelivery: async () => {
    const response = await api.get('/orders/driver/active');
    return response.data;
  },

  // Para admin
  getAllOrders: async (params?: {
    status?: OrderStatus;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get('/orders/admin', { params });
    return response.data;
  },
};

// ==========================================
// DRIVER API
// ==========================================
export const driverApi = {
  updateStatus: async (status: DriverStatus) => {
    const response = await api.patch('/driver/status', { status });
    return response.data;
  },

  updateLocation: async (lat: number, lng: number) => {
    const response = await api.patch('/driver/location', { lat, lng });
    return response.data;
  },

  getEarnings: async (period: 'day' | 'week' | 'month') => {
    const response = await api.get(`/driver/earnings?period=${period}`);
    return response.data;
  },

  getDeliveryHistory: async (page: number = 1) => {
    const response = await api.get(`/driver/history?page=${page}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/driver/stats');
    return response.data;
  },
};

// ==========================================
// ADMIN API
// ==========================================
export const adminApi = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Usuarios
  getUsers: async (params?: { role?: string; search?: string; page?: number }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUser: async (id: string, data: Partial<User>) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  banUser: async (id: string, reason: string) => {
    const response = await api.post(`/admin/users/${id}/ban`, { reason });
    return response.data;
  },

  // Restaurantes
  getPendingRestaurants: async () => {
    const response = await api.get('/admin/restaurants/pending');
    return response.data;
  },

  approveRestaurant: async (id: string) => {
    const response = await api.post(`/admin/restaurants/${id}/approve`);
    return response.data;
  },

  rejectRestaurant: async (id: string, reason: string) => {
    const response = await api.post(`/admin/restaurants/${id}/reject`, { reason });
    return response.data;
  },

  // Repartidores
  getPendingDrivers: async () => {
    const response = await api.get('/admin/drivers/pending');
    return response.data;
  },

  approveDriver: async (id: string) => {
    const response = await api.post(`/admin/drivers/${id}/approve`);
    return response.data;
  },

  rejectDriver: async (id: string, reason: string) => {
    const response = await api.post(`/admin/drivers/${id}/reject`, { reason });
    return response.data;
  },

  // Productos (aprobacion)
  getPendingProducts: async () => {
    const response = await api.get('/admin/products/pending');
    return response.data;
  },

  approveProduct: async (id: string) => {
    const response = await api.post(`/admin/products/${id}/approve`);
    return response.data;
  },

  rejectProduct: async (id: string, reason: string) => {
    const response = await api.post(`/admin/products/${id}/reject`, { reason });
    return response.data;
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    const response = await api.put(`/admin/products/${id}`, data);
    return response.data;
  },

  // Cupones
  getCoupons: async () => {
    const response = await api.get('/admin/coupons');
    return response.data;
  },

  createCoupon: async (data: any) => {
    const response = await api.post('/admin/coupons', data);
    return response.data;
  },

  updateCoupon: async (id: string, data: any) => {
    const response = await api.put(`/admin/coupons/${id}`, data);
    return response.data;
  },

  deleteCoupon: async (id: string) => {
    const response = await api.delete(`/admin/coupons/${id}`);
    return response.data;
  },

  // Finanzas y Estado de Cuenta
  getFinancialSummary: async (period: 'today' | 'week' | 'month') => {
    const response = await api.get(`/admin/finance/summary?period=${period}`);
    return response.data;
  },

  getTransactions: async (period: 'today' | 'week' | 'month', page: number = 1) => {
    const response = await api.get(`/admin/finance/transactions?period=${period}&page=${page}`);
    return response.data;
  },

  getPendingDriverSettlements: async () => {
    const response = await api.get('/admin/finance/driver-settlements');
    return response.data;
  },

  confirmDriverSettlement: async (driverId: string, amount: number, reference: string) => {
    const response = await api.post(`/admin/finance/driver-settlements/${driverId}/confirm`, {
      amount,
      reference,
    });
    return response.data;
  },

  getPendingRestaurantPayouts: async () => {
    const response = await api.get('/admin/finance/restaurant-payouts');
    return response.data;
  },

  confirmRestaurantPayout: async (restaurantId: string, amount: number, reference: string) => {
    const response = await api.post(`/admin/finance/restaurant-payouts/${restaurantId}/confirm`, {
      amount,
      reference,
    });
    return response.data;
  },

  exportFinancialReport: async (period: 'today' | 'week' | 'month', format: 'csv' | 'pdf') => {
    const response = await api.get(`/admin/finance/export?period=${period}&format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

// ==========================================
// REVIEWS API
// ==========================================
export const reviewsApi = {
  createReview: async (data: {
    orderId: string;
    restaurantRating: number;
    driverRating?: number;
    comment?: string;
  }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  getRestaurantReviews: async (restaurantId: string) => {
    const response = await api.get(`/reviews/restaurant/${restaurantId}`);
    return response.data;
  },
};

// ==========================================
// ADDRESSES API
// ==========================================
export const addressesApi = {
  getMyAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/addresses', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },

  setDefault: async (id: string) => {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data;
  },
};

// ==========================================
// CATEGORIES API
// ==========================================
export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// ==========================================
// COUPONS API (para clientes)
// ==========================================
export const couponsApi = {
  validate: async (code: string, restaurantId: string, total: number) => {
    const response = await api.post('/coupons/validate', {
      code,
      restaurantId,
      total,
    });
    return response.data;
  },
};

// ==========================================
// FAVORITES API
// ==========================================
export const favoritesApi = {
  getMyFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  addFavorite: async (restaurantId: string) => {
    const response = await api.post('/favorites', { restaurantId });
    return response.data;
  },

  removeFavorite: async (restaurantId: string) => {
    const response = await api.delete(`/favorites/${restaurantId}`);
    return response.data;
  },
};

// ==========================================
// NOTIFICATIONS API
// ==========================================
export const notificationsApi = {
  registerToken: async (token: string, platform: 'ios' | 'android' | 'web') => {
    const response = await api.post('/notifications/register-token', { token, platform });
    return response.data;
  },

  removeToken: async (token: string) => {
    const response = await api.delete('/notifications/remove-token', { data: { token } });
    return response.data;
  },

  subscribeTopic: async (token: string, topic: string) => {
    const response = await api.post('/notifications/subscribe-topic', { token, topic });
    return response.data;
  },

  unsubscribeTopic: async (token: string, topic: string) => {
    const response = await api.post('/notifications/unsubscribe-topic', { token, topic });
    return response.data;
  },

  sendTest: async () => {
    const response = await api.post('/notifications/test');
    return response.data;
  },
};

// ==========================================
// EXPORT UNIFIED API OBJECT
// ==========================================
const apiService = {
  auth: authApi,
  restaurants: restaurantsApi,
  products: productsApi,
  orders: ordersApi,
  driver: driverApi,
  admin: adminApi,
  reviews: reviewsApi,
  addresses: addressesApi,
  categories: categoriesApi,
  coupons: couponsApi,
  favorites: favoritesApi,
  notifications: notificationsApi,
};

export default apiService;
