import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Restaurants endpoints
export const restaurantsApi = {
  getAll: async (params?: { category?: string; search?: string }) => {
    const response = await api.get('/restaurants', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/restaurants/${id}`);
    return response.data;
  },

  getNearby: async (lat: number, lng: number, radius?: number) => {
    const response = await api.get('/restaurants/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  },
};

// Categories endpoints
export const categoriesApi = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },
};

// Products endpoints
export const productsApi = {
  getAll: async (params?: { restaurantId?: string; categoryId?: string }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  getByRestaurant: async (restaurantId: string) => {
    const response = await api.get(`/products/restaurant/${restaurantId}`);
    return response.data;
  },
};

// Orders endpoints
export const ordersApi = {
  create: async (data: {
    restaurantId: string;
    addressId: string;
    items: Array<{ productId: string; quantity: number; notes?: string }>;
    paymentMethodId?: string;
    couponCode?: string;
  }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/orders');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },
};

// Favorites endpoints
export const favoritesApi = {
  getAll: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  add: async (restaurantId: string) => {
    const response = await api.post('/favorites', { restaurantId });
    return response.data;
  },

  remove: async (restaurantId: string) => {
    const response = await api.delete(`/favorites/${restaurantId}`);
    return response.data;
  },
};

// Addresses endpoints
export const addressesApi = {
  getAll: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  create: async (data: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    zipCode: string;
    reference?: string;
    isDefault?: boolean;
  }) => {
    const response = await api.post('/addresses', data);
    return response.data;
  },

  update: async (id: string, data: Partial<{
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    zipCode: string;
    reference?: string;
    isDefault?: boolean;
  }>) => {
    const response = await api.patch(`/addresses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  },
};

// Coupons endpoints
export const couponsApi = {
  validate: async (code: string) => {
    const response = await api.get(`/coupons/validate/${code}`);
    return response.data;
  },
};

// Reviews endpoints
export const reviewsApi = {
  create: async (data: {
    restaurantId: string;
    orderId: string;
    rating: number;
    comment?: string;
  }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  getByRestaurant: async (restaurantId: string) => {
    const response = await api.get(`/reviews/restaurant/${restaurantId}`);
    return response.data;
  },
};

export default api;
