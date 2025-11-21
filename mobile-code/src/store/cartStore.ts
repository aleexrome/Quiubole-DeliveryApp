// ==========================================
// STORE DEL CARRITO CON ZUSTAND
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, Restaurant, SelectedOption } from '../types';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedOptions: SelectedOption[];
  specialInstructions?: string;
  unitPrice: number;
  total: number;
}

interface CartState {
  items: CartItem[];
  restaurant: Restaurant | null;
  subtotal: number;
  itemCount: number;

  // Actions
  addItem: (product: Product, quantity: number, options?: SelectedOption[], instructions?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setRestaurant: (restaurant: Restaurant) => void;
  getItemById: (itemId: string) => CartItem | undefined;
}

const calculateItemPrice = (product: Product, options: SelectedOption[] = []): number => {
  const optionsPrice = options.reduce((sum, opt) => sum + opt.price, 0);
  return product.price + optionsPrice;
};

const generateItemId = (productId: string, options: SelectedOption[]): string => {
  const optionsKey = options.map(o => `${o.optionId}-${o.choiceId}`).sort().join('|');
  return `${productId}-${optionsKey || 'no-options'}`;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurant: null,
      subtotal: 0,
      itemCount: 0,

      addItem: (product, quantity, options = [], instructions) => {
        const state = get();
        const itemId = generateItemId(product.id, options);
        const unitPrice = calculateItemPrice(product, options);

        // Verificar si es de otro restaurante
        if (state.restaurant && state.restaurant.id !== product.restaurantId) {
          // Limpiar carrito si es de otro restaurante
          set({
            items: [],
            restaurant: null,
            subtotal: 0,
            itemCount: 0,
          });
        }

        const existingItemIndex = state.items.findIndex(item => item.id === itemId);

        if (existingItemIndex >= 0) {
          // Actualizar cantidad si ya existe
          const newItems = [...state.items];
          newItems[existingItemIndex] = {
            ...newItems[existingItemIndex],
            quantity: newItems[existingItemIndex].quantity + quantity,
            total: unitPrice * (newItems[existingItemIndex].quantity + quantity),
          };

          const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0);
          const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

          set({
            items: newItems,
            subtotal: newSubtotal,
            itemCount: newCount,
          });
        } else {
          // Agregar nuevo item
          const newItem: CartItem = {
            id: itemId,
            product,
            quantity,
            selectedOptions: options,
            specialInstructions: instructions,
            unitPrice,
            total: unitPrice * quantity,
          };

          const newItems = [...state.items, newItem];
          const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0);
          const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

          set({
            items: newItems,
            subtotal: newSubtotal,
            itemCount: newCount,
          });
        }
      },

      removeItem: (itemId) => {
        const state = get();
        const newItems = state.items.filter(item => item.id !== itemId);
        const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0);
        const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        set({
          items: newItems,
          subtotal: newSubtotal,
          itemCount: newCount,
          // Limpiar restaurante si carrito queda vacio
          restaurant: newItems.length === 0 ? null : state.restaurant,
        });
      },

      updateQuantity: (itemId, quantity) => {
        const state = get();

        if (quantity <= 0) {
          // Eliminar si cantidad es 0 o menor
          get().removeItem(itemId);
          return;
        }

        const newItems = state.items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity,
              total: item.unitPrice * quantity,
            };
          }
          return item;
        });

        const newSubtotal = newItems.reduce((sum, item) => sum + item.total, 0);
        const newCount = newItems.reduce((sum, item) => sum + item.quantity, 0);

        set({
          items: newItems,
          subtotal: newSubtotal,
          itemCount: newCount,
        });
      },

      clearCart: () => {
        set({
          items: [],
          restaurant: null,
          subtotal: 0,
          itemCount: 0,
        });
      },

      setRestaurant: (restaurant) => {
        set({ restaurant });
      },

      getItemById: (itemId) => {
        return get().items.find(item => item.id === itemId);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
