// ==========================================
// FAVORITES STORE - RESTAURANTES FAVORITOS
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Restaurant } from '../types';

interface FavoriteList {
  id: string;
  name: string;
  icon: string;
  restaurantIds: string[];
  createdAt: Date;
}

interface FavoritesState {
  favorites: string[]; // IDs de restaurantes favoritos
  lists: FavoriteList[]; // Listas personalizadas
  recentOrders: { restaurantId: string; orderedAt: Date }[]; // Para reordenar

  // Actions
  addFavorite: (restaurantId: string) => void;
  removeFavorite: (restaurantId: string) => void;
  isFavorite: (restaurantId: string) => boolean;
  toggleFavorite: (restaurantId: string) => boolean;

  // Lists
  createList: (name: string, icon?: string) => FavoriteList;
  deleteList: (listId: string) => void;
  renameList: (listId: string, name: string) => void;
  addToList: (listId: string, restaurantId: string) => void;
  removeFromList: (listId: string, restaurantId: string) => void;
  getList: (listId: string) => FavoriteList | undefined;

  // Recent orders
  addRecentOrder: (restaurantId: string) => void;
  getRecentRestaurants: () => string[];
  clearRecentOrders: () => void;
}

const DEFAULT_LISTS: FavoriteList[] = [
  { id: 'default-antojos', name: 'Antojos', icon: '😋', restaurantIds: [], createdAt: new Date() },
  { id: 'default-fiestas', name: 'Para fiestas', icon: '🎉', restaurantIds: [], createdAt: new Date() },
  { id: 'default-saludable', name: 'Saludable', icon: '🥗', restaurantIds: [], createdAt: new Date() },
];

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      lists: DEFAULT_LISTS,
      recentOrders: [],

      addFavorite: (restaurantId) => {
        set((state) => ({
          favorites: state.favorites.includes(restaurantId)
            ? state.favorites
            : [...state.favorites, restaurantId],
        }));
      },

      removeFavorite: (restaurantId) => {
        set((state) => ({
          favorites: state.favorites.filter((id) => id !== restaurantId),
          // También remover de todas las listas
          lists: state.lists.map((list) => ({
            ...list,
            restaurantIds: list.restaurantIds.filter((id) => id !== restaurantId),
          })),
        }));
      },

      isFavorite: (restaurantId) => {
        return get().favorites.includes(restaurantId);
      },

      toggleFavorite: (restaurantId) => {
        const isFav = get().isFavorite(restaurantId);
        if (isFav) {
          get().removeFavorite(restaurantId);
        } else {
          get().addFavorite(restaurantId);
        }
        return !isFav;
      },

      createList: (name, icon = '📁') => {
        const newList: FavoriteList = {
          id: `list-${Date.now()}`,
          name,
          icon,
          restaurantIds: [],
          createdAt: new Date(),
        };
        set((state) => ({
          lists: [...state.lists, newList],
        }));
        return newList;
      },

      deleteList: (listId) => {
        // No permitir eliminar listas default
        if (listId.startsWith('default-')) return;
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== listId),
        }));
      },

      renameList: (listId, name) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId ? { ...list, name } : list
          ),
        }));
      },

      addToList: (listId, restaurantId) => {
        // Primero asegurar que está en favoritos
        if (!get().isFavorite(restaurantId)) {
          get().addFavorite(restaurantId);
        }

        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId && !list.restaurantIds.includes(restaurantId)
              ? { ...list, restaurantIds: [...list.restaurantIds, restaurantId] }
              : list
          ),
        }));
      },

      removeFromList: (listId, restaurantId) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === listId
              ? { ...list, restaurantIds: list.restaurantIds.filter((id) => id !== restaurantId) }
              : list
          ),
        }));
      },

      getList: (listId) => {
        return get().lists.find((list) => list.id === listId);
      },

      addRecentOrder: (restaurantId) => {
        set((state) => {
          // Mantener solo últimos 10 restaurantes únicos
          const filtered = state.recentOrders.filter((r) => r.restaurantId !== restaurantId);
          return {
            recentOrders: [
              { restaurantId, orderedAt: new Date() },
              ...filtered,
            ].slice(0, 10),
          };
        });
      },

      getRecentRestaurants: () => {
        return get().recentOrders.map((r) => r.restaurantId);
      },

      clearRecentOrders: () => {
        set({ recentOrders: [] });
      },
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hook helper
export const useFavorites = () => {
  const store = useFavoritesStore();
  return {
    favorites: store.favorites,
    lists: store.lists,
    isFavorite: store.isFavorite,
    toggleFavorite: store.toggleFavorite,
    addToList: store.addToList,
    removeFromList: store.removeFromList,
    createList: store.createList,
    recentRestaurants: store.getRecentRestaurants(),
  };
};
