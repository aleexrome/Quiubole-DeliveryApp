// ==========================================
// CONFIGURACION DE API
// ==========================================

import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Restaurant, Product, Order, OrderStatus, DriverStatus } from '../types';

// ============================================
// URL del backend.
//
// En producción: viene de EXPO_PUBLIC_API_URL (configurado en eas.json
// y/o variables de entorno del build). Ej: https://api.devolon.mx/api
//
// En desarrollo (Expo dev client / emulator): default 10.0.2.2:4000
// (forwarded de localhost del host de Windows via emulador Android).
// En iOS Simulator usa localhost:4000 directo.
//
// Puerto 4000 en dev porque en Windows iphlpsvc suele ocupar IPv4:3000
// silenciosamente, forzando NestJS a IPv6 e inalcanzable desde emulador.
// ============================================
const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ||
  'http://10.0.2.2:4000/api';

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
    const token = response.data.accessToken ?? response.data.token;
    if (token) await AsyncStorage.setItem('auth-token', token);
    return { ...response.data, token };
  },

  register: async (data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    role?: string;
    /** Municipio (zone.name) que eligió en el dropdown. */
    zone?: string;
  }) => {
    // Backend espera firstName/lastName separados, no "name"
    const body: any = { ...data };
    if (!body.firstName && body.name) {
      const parts = body.name.trim().split(/\s+/);
      body.firstName = parts[0];
      body.lastName = parts.slice(1).join(' ') || parts[0];
      delete body.name;
    }
    // role + zone SÍ se mandan: el backend ya los acepta en RegisterDto.
    const response = await api.post('/auth/register', body);
    const token = response.data.accessToken ?? response.data.token;
    if (token) await AsyncStorage.setItem('auth-token', token);
    return { ...response.data, token };
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
    /** Zona/municipio del cliente — fallback cuando no hay GPS. */
    zone?: string;
  }) => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  // Para dueños de restaurantes
  getMyRestaurant: async () => {
    const response = await api.get('/restaurants/my-restaurant');
    return response.data;
  },

  // Update del restaurant del owner: obtiene el id propio y hace PATCH
  // al endpoint canónico /restaurants/:id (PUT no existe, es PATCH).
  updateMyRestaurant: async (data: Partial<Restaurant>) => {
    const me = await api.get('/restaurants/my-restaurant');
    if (!me.data?.id) throw new Error('No tienes un negocio asociado');
    const response = await api.patch(`/restaurants/${me.data.id}`, data);
    return response.data;
  },

  // Abre/cierra el negocio del owner autenticado. El backend toca
  // SOLO `isOpen` (no `isActive`, que es admin-only para suspender).
  updateAvailability: async (isOpen: boolean) => {
    const response = await api.patch('/restaurants/my/open', { isOpen });
    return response.data;
  },

  // Stats del restaurant del owner. El backend resuelve el restaurant
  // desde el JWT (no necesita id). Devuelve { orders, revenue, rating, ... }.
  getStats: async (period: 'day' | 'week' | 'month') => {
    const response = await api.get('/restaurants/stats', { params: { period } });
    return response.data;
  },
};

// ==========================================
// PRODUCTS API
// ==========================================
export const productsApi = {
  // Backend: GET /products?restaurantId=X. El alias 'my' resuelve al
  // restaurant del owner autenticado (vía /restaurants/my-restaurant).
  getByRestaurant: async (restaurantIdOrMy: string) => {
    let restaurantId = restaurantIdOrMy;
    if (restaurantIdOrMy === 'my') {
      const myResp = await api.get('/restaurants/my-restaurant');
      if (!myResp.data?.id) return [];
      restaurantId = myResp.data.id;
    }
    const response = await api.get('/products', { params: { restaurantId } });
    return response.data;
  },

  /**
   * Lista TODOS los productos del restaurante INCLUYENDO los pendientes
   * de aprobación. Solo accesible para editor asignado o admin.
   * Usar desde EditorMenuScreen para que el editor vea su carta completa
   * con los productos en revisión marcados con badge.
   */
  getManagedByRestaurant: async (restaurantId: string) => {
    const response = await api.get('/products/managed/by-restaurant', {
      params: { restaurantId },
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Dueños del restaurante, editores asignados y admin
  create: async (data: Partial<Product> & { restaurantId: string }) => {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Backend usa PATCH (no PUT)
  update: async (id: string, data: Partial<Product>) => {
    const response = await api.patch(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },

  /**
   * Toggle disponibilidad. El restaurant owner usa esto desde su menú
   * para activar/desactivar productos sin tocar precio/foto/nombre.
   * El backend valida que owners solo puedan modificar `isAvailable`.
   * Si no se pasa `isAvailable`, invierte el estado actual (fetch first).
   */
  toggleAvailability: async (id: string, isAvailable?: boolean) => {
    let next = isAvailable;
    if (next === undefined) {
      const current = await api.get(`/products/${id}`);
      next = !current.data?.isAvailable;
    }
    const response = await api.patch(`/products/${id}`, { isAvailable: next });
    return response.data;
  },
};

// ==========================================
// EDITORS API (rol editor desde la app)
// ==========================================
export const editorsApi = {
  /** Lista de restaurantes que el editor autenticado puede editar. */
  getMyRestaurants: async () => {
    const response = await api.get('/editors/me/restaurants');
    return response.data;
  },

  /** Edita el restaurante (solo campos permitidos por el DTO del backend). */
  updateRestaurant: async (
    restaurantId: string,
    data: Partial<Restaurant>,
  ) => {
    const response = await api.patch(`/restaurants/${restaurantId}`, data);
    return response.data;
  },
};

// ==========================================
// CHAT API (editor ↔ dueño del restaurante)
// ==========================================
export const chatApi = {
  /** Lista canales donde participo (como editor o como dueño). */
  listChannels: async () => {
    const response = await api.get('/chat/channels');
    return response.data;
  },

  /** Número total de mensajes sin leer. Útil para badge de tab. */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/chat/unread-count');
    return response.data;
  },

  /** Historial del canal (orden ascendente, paginado por timestamp). */
  getMessages: async (
    channelId: string,
    opts?: { limit?: number; before?: string },
  ) => {
    const response = await api.get(`/chat/channels/${channelId}/messages`, {
      params: opts,
    });
    return response.data;
  },

  /** Envía un mensaje de texto. Dispara push al otro lado. */
  sendMessage: async (channelId: string, body: string) => {
    const response = await api.post(`/chat/channels/${channelId}/messages`, {
      body,
    });
    return response.data;
  },
};

// ==========================================
// UPLOADS API (fotos de productos/restaurantes)
// ==========================================
export const uploadsApi = {
  /** Sube una imagen de producto. Regresa { url } o similar. */
  uploadProductImage: async (localUri: string) => {
    const formData = new FormData();
    // @ts-ignore - React Native acepta { uri, name, type }
    formData.append('file', {
      uri: localUri,
      name: 'product.jpg',
      type: 'image/jpeg',
    });
    const response = await api.post('/uploads/product-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadRestaurantImage: async (localUri: string) => {
    const formData = new FormData();
    // @ts-ignore
    formData.append('file', {
      uri: localUri,
      name: 'restaurant.jpg',
      type: 'image/jpeg',
    });
    const response = await api.post('/uploads/restaurant-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    /** Notas sobre la comida (al restaurante) — "sin catsup", "sin chile". */
    customerNotes?: string;
    /** Indicaciones del domicilio (al rider) — "depto 2B, timbre roto". */
    deliveryInstructions?: string;
    paymentMethod: string;
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
    const response = await api.put(`/orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Para restaurantes
  getRestaurantOrders: async (status?: OrderStatus) => {
    const params = status ? { status } : {};
    const response = await api.get('/orders/restaurant', { params });
    return response.data;
  },

  acceptOrder: async (id: string, estimatedTime?: number) => {
    const response = await api.put(`/orders/${id}/accept`, { estimatedTime });
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
    const response = await api.put(`/orders/${id}/ready`);
    return response.data;
  },

  // Para repartidores
  // Endpoint del backend: /orders/driver/available. Lat/lng/radius por
  // ahora se ignoran en el server (devuelve todas las ready_for_pickup).
  // Cuando se implemente filtro por distancia GPS, pasarán como query.
  getAvailableOrders: async (
    lat?: number,
    lng?: number,
    radius: number = 5,
  ) => {
    const params: any = { radius };
    if (lat !== undefined) params.lat = lat;
    if (lng !== undefined) params.lng = lng;
    const response = await api.get('/orders/driver/available', { params });
    return response.data;
  },

  acceptDelivery: async (orderId: string) => {
    const response = await api.post(`/orders/${orderId}/accept-delivery`);
    return response.data;
  },

  markPickedUp: async (orderId: string) => {
    const response = await api.put(`/orders/${orderId}/pickup`);
    return response.data;
  },

  markDelivered: async (orderId: string) => {
    const response = await api.put(`/orders/${orderId}/deliver`);
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
  /**
   * Toggle availability del driver (online/offline). El backend acepta
   * boolean isAvailable, no un enum string. Traducimos aquí.
   */
  updateStatus: async (status: DriverStatus) => {
    const isAvailable = status === 'online' || status === 'available';
    const response = await api.put('/drivers/status', { isAvailable });
    return response.data;
  },

  updateLocation: async (lat: number, lng: number) => {
    // Backend espera `latitude` y `longitude` en el body, no `lat/lng`.
    const response = await api.put('/drivers/location', {
      latitude: lat,
      longitude: lng,
    });
    return response.data;
  },

  getEarnings: async (period: 'day' | 'week' | 'month') => {
    // El endpoint del backend usa `startDate`/`endDate`. Calculamos
    // el rango desde el período pedido.
    const end = new Date();
    const start = new Date();
    if (period === 'day') start.setHours(0, 0, 0, 0);
    else if (period === 'week') start.setDate(start.getDate() - 7);
    else start.setDate(start.getDate() - 30);
    const response = await api.get('/drivers/earnings', {
      params: { startDate: start.toISOString(), endDate: end.toISOString() },
    });
    return response.data;
  },

  getDeliveryHistory: async (_page: number = 1) => {
    // El backend devuelve todos los orders del driver en /drivers/orders.
    // Paginación no implementada todavía — devolvemos lista completa.
    const response = await api.get('/drivers/orders');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/drivers/stats');
    return response.data;
  },

  /**
   * Actualiza info del vehículo del driver. La info se muestra al
   * cliente cuando el driver toma su pedido (placas, modelo, color).
   */
  updateVehicle: async (data: {
    vehicleType?: string;
    vehiclePlate?: string;
    vehicleModel?: string;
    vehicleColor?: string;
  }) => {
    const response = await api.put('/drivers/vehicle', data);
    return response.data;
  },
};

// ==========================================
// ADMIN API
// ==========================================
export const adminApi = {
  getDashboardStats: async () => {
    // Backend expone el endpoint como /admin/dashboard (no /admin/stats).
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Usuarios. Backend devuelve { data, total, page, totalPages } paginado.
  // Devolvemos solo `data` para que las pantallas trabajen con un array
  // directo; quien necesite la metadata puede usar `getUsersPaged`.
  getUsers: async (params?: { role?: string; search?: string; page?: number }) => {
    const response = await api.get('/admin/users', { params });
    return response.data?.data ?? [];
  },

  getUsersPaged: async (params?: { role?: string; search?: string; page?: number; limit?: number }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Conteos por rol para las pills de filtro en la pantalla Users.
  getUserStats: async () => {
    const response = await api.get('/admin/users-stats');
    return response.data as {
      all: number;
      customer: number;
      client: number;
      restaurant: number;
      driver: number;
      editor: number;
      admin: number;
    };
  },

  updateUser: async (id: string, data: Partial<User>) => {
    const response = await api.put(`/admin/users/${id}`, data);
    return response.data;
  },

  banUser: async (id: string, reason: string) => {
    const response = await api.post(`/admin/users/${id}/ban`, { reason });
    return response.data;
  },

  // ============ RESTAURANTES ============
  // Lista filtrable por status (pending/approved/all). Devuelve array.
  getRestaurants: async (params?: {
    status?: 'pending' | 'approved' | 'all';
    page?: number;
  }) => {
    const response = await api.get('/admin/restaurants', { params });
    return (response.data?.data ?? []) as Restaurant[];
  },

  // Alias legacy — algunas pantallas todavía la llaman.
  getPendingRestaurants: async () => {
    const response = await api.get('/admin/restaurants', {
      params: { status: 'pending' },
    });
    return (response.data?.data ?? []) as Restaurant[];
  },

  approveRestaurant: async (id: string) => {
    const response = await api.post(`/admin/restaurants/${id}/approve`);
    return response.data;
  },

  rejectRestaurant: async (id: string, reason: string) => {
    const response = await api.post(`/admin/restaurants/${id}/reject`, { reason });
    return response.data;
  },

  // ============ PEDIDOS ============
  // Listado global para el admin. Devuelve array.
  getOrders: async (params?: {
    status?: string;
    page?: number;
  }) => {
    const response = await api.get('/admin/orders', { params });
    return (response.data?.data ?? []) as Order[];
  },

  getOrdersStats: async () => {
    const response = await api.get('/admin/orders-stats');
    return response.data as {
      all: number;
      active: number;
      pending: number;
      confirmed: number;
      preparing: number;
      ready_for_pickup: number;
      driver_assigned: number;
      picked_up: number;
      on_the_way: number;
      delivered: number;
      cancelled: number;
    };
  },

  getRestaurantsStats: async () => {
    const response = await api.get('/admin/restaurants-stats');
    return response.data as { all: number; approved: number; pending: number };
  },

  // ============ REPARTIDORES ============
  getDrivers: async (params?: {
    status?: 'all' | 'active' | 'inactive' | 'pending';
    page?: number;
  }) => {
    const response = await api.get('/admin/drivers', { params });
    return (response.data?.data ?? []) as User[];
  },

  getDriversStats: async () => {
    const response = await api.get('/admin/drivers-stats');
    return response.data as {
      all: number;
      active: number;
      inactive: number;
      pending: number;
    };
  },

  // Alias legacy.
  getPendingDrivers: async () => {
    const response = await api.get('/admin/drivers', {
      params: { status: 'pending' },
    });
    return (response.data?.data ?? []) as User[];
  },

  // ============ APROBACIÓN DE USUARIOS ============
  // Endpoints unificados — aplican a driver/restaurant/editor.
  approveUser: async (id: string) => {
    const response = await api.post(`/admin/users/${id}/approve`);
    return response.data;
  },

  rejectUser: async (id: string, reason?: string) => {
    const response = await api.post(`/admin/users/${id}/reject`, { reason });
    return response.data;
  },

  // ============ PRODUCTOS ============
  getProducts: async (params?: {
    status?: 'pending' | 'approved' | 'all';
    page?: number;
  }) => {
    const response = await api.get('/admin/products', { params });
    return (response.data?.data ?? []) as Product[];
  },

  getProductsStats: async () => {
    const response = await api.get('/admin/products-stats');
    return response.data as { all: number; approved: number; pending: number };
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

  // ==========================================
  // Editores (gestión desde panel admin)
  // ==========================================
  /** Lista todos los editores con sus restaurantes asignados. */
  listEditors: async () => {
    const response = await api.get('/admin/editors');
    return response.data;
  },

  /** Promueve un usuario a editor. */
  promoteToEditor: async (userId: string) => {
    const response = await api.post(`/admin/editors/${userId}`);
    return response.data;
  },

  /** Degrada un editor a client y limpia sus asignaciones. */
  demoteEditor: async (userId: string) => {
    const response = await api.delete(`/admin/editors/${userId}`);
    return response.data;
  },

  /** Asigna uno o varios restaurantes a un editor (aditivo). */
  assignEditorRestaurants: async (userId: string, restaurantIds: string[]) => {
    const response = await api.post(
      `/admin/editors/${userId}/restaurants`,
      { restaurantIds },
    );
    return response.data;
  },

  /** Remueve un restaurante del set del editor. */
  unassignEditorRestaurant: async (userId: string, restaurantId: string) => {
    const response = await api.delete(
      `/admin/editors/${userId}/restaurants/${restaurantId}`,
    );
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

  getById: async (id: string) => {
    const response = await api.get(`/addresses/${id}`);
    return response.data;
  },

  create: async (data: {
    label?: string;
    street: string;
    apartment?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude: number;
    longitude: number;
    instructions?: string;
    isDefault?: boolean;
  }) => {
    const response = await api.post('/addresses', data);
    return response.data;
  },

  update: async (id: string, data: any) => {
    // Backend usa PATCH (no PUT) para parciales.
    const response = await api.patch(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },

  setDefault: async (id: string) => {
    // Backend tiene POST /addresses/:id/default (no PATCH).
    const response = await api.post(`/addresses/${id}/default`);
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
// COVERAGE ZONES API — municipios donde Devolón opera
// Backend: /coverage-zones. Por ahora MVP con Tenancingo.
// ==========================================
export const zonesApi = {
  /** Zonas activas — usado por el dropdown del registro. */
  getActive: async (): Promise<
    Array<{
      id: string;
      name: string;
      description?: string;
      centerLatitude: number;
      centerLongitude: number;
      radiusKm: number;
      isActive: boolean;
    }>
  > => {
    const response = await api.get('/coverage-zones/active');
    return response.data;
  },
};

// ==========================================
// DEVO CUPONES API — sistema de lealtad puntos → cupones personales
// Backend: /devo-coupons/*. Cada pedido entregado suma 10 pts. Al
// cruzar 100 pts el sistema crea un cupón pending_admin que el admin
// configura (% off, monto fijo, delivery gratis, etc.).
// ==========================================
export const devoCouponsApi = {
  /** Mis cupones + balance de puntos del usuario logueado. */
  getMy: async (): Promise<{
    points: number;
    lifetime: number;
    coupons: any[];
  }> => {
    const response = await api.get('/devo-coupons/my');
    return response.data;
  },

  /** Admin: lista cupones pending_admin para asignarles type/value. */
  getPendingForAdmin: async () => {
    const response = await api.get('/devo-coupons/admin/pending');
    return response.data;
  },

  /** Admin: configura un cupón pendiente y lo activa para el cliente. */
  assign: async (
    couponId: string,
    data: {
      type: 'percentage' | 'fixed' | 'free_delivery' | 'product_discount';
      value: number;
      maxDiscount?: number;
      minOrderAmount?: number;
      restaurantId?: string;
      productId?: string;
      description?: string;
      expiresAt?: string;
    },
  ) => {
    const response = await api.post(`/devo-coupons/${couponId}/assign`, data);
    return response.data;
  },

  /**
   * Preview en checkout: calcula el descuento que aplicaría el cupón a
   * un subtotal sin marcarlo como usado. Tira BadRequest si no aplica
   * (subtotal mínimo, restaurante distinto, expirado, etc.).
   */
  preview: async (
    couponId: string,
    data: {
      subtotal: number;
      deliveryFee: number;
      restaurantId: string;
      productIds?: string[];
    },
  ): Promise<{ discount: number; deliveryDiscount: number }> => {
    const response = await api.post(`/devo-coupons/${couponId}/preview`, data);
    return response.data;
  },
};

// ==========================================
// MESSAGES API — chat por pedido (customer ↔ driver ↔ restaurant)
// Backend: /messages/* (módulo `messages`, distinto del legacy `chat`).
// ==========================================
export const messagesApi = {
  /**
   * Mensajes entre el usuario actual y `otherUserId` para un pedido.
   * Si no se pasa otherUserId, devuelve toda la bandeja del usuario.
   * El backend marca como leídos los entrantes al consultar.
   */
  getByOrder: async (orderId: string, otherUserId?: string) => {
    const response = await api.get(`/messages/order/${orderId}`, {
      params: otherUserId ? { with: otherUserId } : undefined,
    });
    return response.data;
  },

  /** Lista de los otros participantes del pedido (excluyendo al caller). */
  getParticipants: async (
    orderId: string,
  ): Promise<
    Array<{ userId: string; role: 'customer' | 'driver' | 'restaurant' }>
  > => {
    const response = await api.get(`/messages/order/${orderId}/participants`);
    return response.data;
  },

  /** Envía un mensaje. Backend valida que ambos pertenezcan al pedido. */
  send: async (orderId: string, toUserId: string, text: string) => {
    const response = await api.post('/messages', { orderId, toUserId, text });
    return response.data;
  },

  /** Marca un mensaje específico como leído. */
  markRead: async (messageId: string) => {
    const response = await api.patch(`/messages/${messageId}/read`);
    return response.data;
  },

  /** Total de mensajes sin leer del usuario (para badges). */
  getUnreadCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/messages/unread-count');
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
  editors: editorsApi,
  chat: chatApi,
  uploads: uploadsApi,
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
