import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  DEMO_MODE,
  mockCategories,
  mockRestaurants,
  mockProducts,
  mockOrders,
  mockUser,
  mockAddresses,
} from './mockData';

// 10.0.2.2 is the special IP for Android emulator to access host machine
const API_URL = 'http://10.0.2.2:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
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
      SecureStore.deleteItemAsync('token');
    }
    return Promise.reject(error);
  }
);

// Helper to handle demo mode or API fallback
const withDemoFallback = async <T>(
  apiCall: () => Promise<T>,
  mockData: T
): Promise<T> => {
  if (DEMO_MODE) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockData;
  }
  try {
    return await apiCall();
  } catch (error) {
    console.log('API unavailable, using demo data');
    return mockData;
  }
};

// Auth endpoints
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    return withDemoFallback(
      async () => {
        const response = await api.post('/auth/register', data);
        return response.data;
      },
      { user: { ...mockUser, ...data }, token: 'demo-token-12345' }
    );
  },

  login: async (data: { email: string; password: string }) => {
    return withDemoFallback(
      async () => {
        const response = await api.post('/auth/login', data);
        return response.data;
      },
      { user: mockUser, token: 'demo-token-12345' }
    );
  },

  getProfile: async () => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/auth/profile');
        return response.data;
      },
      mockUser
    );
  },
};

// Restaurants endpoints
export const restaurantsApi = {
  getAll: async (params?: { category?: string; search?: string }) => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/restaurants', { params });
        return response.data;
      },
      params?.search
        ? mockRestaurants.filter(r =>
            r.name.toLowerCase().includes(params.search!.toLowerCase())
          )
        : params?.category
        ? mockRestaurants.filter(r =>
            r.categories.some(c => c.toLowerCase().includes(params.category!.toLowerCase()))
          )
        : mockRestaurants
    );
  },

  getById: async (id: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.get(`/restaurants/${id}`);
        return response.data;
      },
      mockRestaurants.find(r => r.id === id) || mockRestaurants[0]
    );
  },

  getNearby: async (lat: number, lng: number, radius?: number) => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/restaurants/nearby', {
          params: { lat, lng, radius },
        });
        return response.data;
      },
      mockRestaurants
    );
  },
};

// Categories endpoints
export const categoriesApi = {
  getAll: async () => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/categories');
        return response.data;
      },
      mockCategories
    );
  },
};

// Products endpoints
export const productsApi = {
  getAll: async (params?: { restaurantId?: string; categoryId?: string }) => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/products', { params });
        return response.data;
      },
      params?.restaurantId
        ? mockProducts[params.restaurantId] || []
        : Object.values(mockProducts).flat()
    );
  },

  getById: async (id: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.get(`/products/${id}`);
        return response.data;
      },
      Object.values(mockProducts).flat().find(p => p.id === id)
    );
  },

  getByRestaurant: async (restaurantId: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.get(`/products/restaurant/${restaurantId}`);
        return response.data;
      },
      mockProducts[restaurantId] || []
    );
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
    return withDemoFallback(
      async () => {
        const response = await api.post('/orders', data);
        return response.data;
      },
      {
        id: `o${Date.now()}`,
        orderNumber: `QUI-${Math.floor(Math.random() * 1000)}`,
        status: 'pending',
        ...data,
        createdAt: new Date().toISOString(),
      }
    );
  },

  getAll: async () => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/orders');
        return response.data;
      },
      mockOrders
    );
  },

  getById: async (id: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.get(`/orders/${id}`);
        return response.data;
      },
      mockOrders.find(o => o.id === id) || mockOrders[0]
    );
  },

  cancel: async (id: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.patch(`/orders/${id}/cancel`);
        return response.data;
      },
      { id, status: 'cancelled' }
    );
  },
};

// Favorites endpoints
export const favoritesApi = {
  getAll: async () => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/favorites');
        return response.data;
      },
      [mockRestaurants[0], mockRestaurants[3]]
    );
  },

  add: async (restaurantId: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.post('/favorites', { restaurantId });
        return response.data;
      },
      { restaurantId, success: true }
    );
  },

  remove: async (restaurantId: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.delete(`/favorites/${restaurantId}`);
        return response.data;
      },
      { success: true }
    );
  },
};

// Addresses endpoints
export const addressesApi = {
  getAll: async () => {
    return withDemoFallback(
      async () => {
        const response = await api.get('/addresses');
        return response.data;
      },
      mockAddresses
    );
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
    return withDemoFallback(
      async () => {
        const response = await api.post('/addresses', data);
        return response.data;
      },
      { id: `a${Date.now()}`, ...data }
    );
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
    return withDemoFallback(
      async () => {
        const response = await api.patch(`/addresses/${id}`, data);
        return response.data;
      },
      { id, ...data }
    );
  },

  delete: async (id: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.delete(`/addresses/${id}`);
        return response.data;
      },
      { success: true }
    );
  },
};

// Coupons endpoints
export const couponsApi = {
  validate: async (code: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.get(`/coupons/validate/${code}`);
        return response.data;
      },
      code === 'DEMO10'
        ? { valid: true, discountType: 'percentage', discountValue: 10 }
        : { valid: false }
    );
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
    return withDemoFallback(
      async () => {
        const response = await api.post('/reviews', data);
        return response.data;
      },
      { id: `r${Date.now()}`, ...data, createdAt: new Date().toISOString() }
    );
  },

  getByRestaurant: async (restaurantId: string) => {
    return withDemoFallback(
      async () => {
        const response = await api.get(`/reviews/restaurant/${restaurantId}`);
        return response.data;
      },
      [
        { id: 'r1', rating: 5, comment: 'Excelente comida!', user: { firstName: 'Maria' }, createdAt: new Date().toISOString() },
        { id: 'r2', rating: 4, comment: 'Muy bueno, entrega rapida', user: { firstName: 'Juan' }, createdAt: new Date().toISOString() },
      ]
    );
  },
};

export default api;
