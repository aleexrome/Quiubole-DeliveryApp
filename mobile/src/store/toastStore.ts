// ==========================================
// TOAST STORE - MANEJO GLOBAL DE NOTIFICACIONES
// ==========================================

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  visible: boolean;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastStore extends ToastState {
  show: (type: ToastType, message: string, duration?: number) => void;
  hide: () => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  visible: false,
  type: 'info',
  message: '',
  duration: 3000,

  show: (type, message, duration = 3000) => {
    set({ visible: true, type, message, duration });
  },

  hide: () => {
    set({ visible: false });
  },

  success: (message, duration = 3000) => {
    set({ visible: true, type: 'success', message, duration });
  },

  error: (message, duration = 4000) => {
    set({ visible: true, type: 'error', message, duration });
  },

  warning: (message, duration = 3500) => {
    set({ visible: true, type: 'warning', message, duration });
  },

  info: (message, duration = 3000) => {
    set({ visible: true, type: 'info', message, duration });
  },
}));

// Hook helper para uso mas facil
export const useToast = () => {
  const { show, hide, success, error, warning, info } = useToastStore();
  return { show, hide, success, error, warning, info };
};
