// ==========================================
// STORE DE AUTENTICACION CON ZUSTAND
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verifyEmail: (code: string) => Promise<boolean>;
  resendVerificationCode: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  /** Municipio donde el usuario usará Devolón (Tenancingo, etc.). */
  zone?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login({ email, password });
          set({
            user: response.user,
            token: response.accessToken ?? response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Error al iniciar sesion',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          set({
            user: response.user,
            token: response.accessToken ?? response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          // Automaticamente envia codigo de verificacion
        } catch (error: any) {
          set({
            error: error.message || 'Error al registrarse',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      verifyEmail: async (code: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.verifyEmail(code);
          if (response.success) {
            set((state) => ({
              user: state.user ? { ...state.user, emailVerified: true } : null,
              isLoading: false,
            }));
            return true;
          }
          return false;
        } catch (error: any) {
          set({
            error: error.message || 'Codigo invalido',
            isLoading: false,
          });
          return false;
        }
      },

      resendVerificationCode: async () => {
        set({ isLoading: true, error: null });
        try {
          await authApi.resendVerificationCode();
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Error al reenviar codigo',
            isLoading: false,
          });
          throw error;
        }
      },

      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.forgotPassword(email);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Error al enviar email',
            isLoading: false,
          });
          throw error;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await authApi.resetPassword(token, password);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Error al restablecer password',
            isLoading: false,
          });
          throw error;
        }
      },

      updateProfile: async (data: Partial<User>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.updateProfile(data);
          set((state) => ({
            user: state.user ? { ...state.user, ...response.user } : null,
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Error al actualizar perfil',
            isLoading: false,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
