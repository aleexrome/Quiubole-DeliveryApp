import { create } from 'zustand';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  profileImage?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  image?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  description: string;
  image: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  categories: string[];
  isOpen: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  restaurantId: string;
  categoryId: string;
  isAvailable: boolean;
  preparationTime?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface Address {
  id: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  zipCode: string;
  reference?: string;
  isDefault: boolean;
}

// Auth Store
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));

// Cart Store
interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  restaurantId: null,

  addItem: (product, quantity = 1) => {
    const { items, restaurantId } = get();

    // If cart has items from different restaurant, clear it
    if (restaurantId && restaurantId !== product.restaurantId) {
      set({ items: [], restaurantId: product.restaurantId });
    }

    const existingItem = items.find((item) => item.product.id === product.id);

    if (existingItem) {
      set({
        items: items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ),
      });
    } else {
      set({
        items: [...items, { product, quantity }],
        restaurantId: product.restaurantId,
      });
    }
  },

  removeItem: (productId) => {
    const { items } = get();
    const newItems = items.filter((item) => item.product.id !== productId);
    set({
      items: newItems,
      restaurantId: newItems.length > 0 ? get().restaurantId : null,
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  clearCart: () => set({ items: [], restaurantId: null }),

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));

// App Store (for UI state)
interface AppState {
  selectedCategory: string | null;
  searchQuery: string;
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCategory: null,
  searchQuery: '',
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
