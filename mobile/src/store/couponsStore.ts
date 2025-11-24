// ==========================================
// COUPONS STORE - SISTEMA DE CUPONES AVANZADO
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'free_delivery' | 'bogo' | 'free_item';
  value: number;
  description: string;
  termsAndConditions: string[];
  minOrderAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usedCount: number;
  userUsageLimit?: number;
  applicableRestaurants?: string[]; // null = todos
  applicableCategories?: string[];
  applicableProducts?: string[];
  excludedProducts?: string[];
  firstOrderOnly?: boolean;
  newUserOnly?: boolean;
  dayOfWeek?: number[]; // 0=domingo, 1=lunes, etc.
  timeRange?: { start: string; end: string };
  stackable: boolean;
  priority: number;
  source: 'promo' | 'referral' | 'loyalty' | 'special' | 'birthday';
  banner?: string;
}

interface UserCoupon extends Coupon {
  claimedAt: Date;
  usedAt?: Date;
  orderId?: string;
}

interface CouponValidationResult {
  valid: boolean;
  message: string;
  discount?: number;
  coupon?: Coupon;
}

interface CouponsState {
  availableCoupons: Coupon[];
  userCoupons: UserCoupon[];
  appliedCoupon: UserCoupon | null;

  // Actions
  fetchAvailableCoupons: () => Promise<void>;
  claimCoupon: (code: string) => Promise<CouponValidationResult>;
  validateCoupon: (
    code: string,
    orderTotal: number,
    restaurantId?: string,
    productIds?: string[],
    isFirstOrder?: boolean
  ) => CouponValidationResult;
  applyCoupon: (coupon: UserCoupon) => void;
  removeCoupon: () => void;
  useCoupon: (couponId: string, orderId: string) => void;
  calculateDiscount: (orderTotal: number, deliveryFee: number) => number;
  getUserCoupons: () => UserCoupon[];
  getActiveCoupons: () => UserCoupon[];
}

// Cupones de ejemplo
const MOCK_COUPONS: Coupon[] = [
  {
    id: 'coupon-1',
    code: 'BIENVENIDO50',
    type: 'percentage',
    value: 50,
    description: '50% de descuento en tu primer pedido',
    termsAndConditions: [
      'Valido solo para nuevos usuarios',
      'Descuento maximo de $150',
      'No acumulable con otras promociones',
    ],
    maxDiscount: 150,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    newUserOnly: true,
    firstOrderOnly: true,
    usedCount: 0,
    stackable: false,
    priority: 1,
    source: 'promo',
  },
  {
    id: 'coupon-2',
    code: 'ENVIOGRATIS',
    type: 'free_delivery',
    value: 100,
    description: 'Envio gratis en tu pedido',
    termsAndConditions: [
      'Pedido minimo de $100',
      'Valido en restaurantes participantes',
    ],
    minOrderAmount: 100,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usedCount: 0,
    stackable: true,
    priority: 2,
    source: 'promo',
  },
  {
    id: 'coupon-3',
    code: 'QUIUBOLE10',
    type: 'percentage',
    value: 10,
    description: '10% de descuento',
    termsAndConditions: [
      'Pedido minimo de $150',
      'Descuento maximo de $100',
    ],
    minOrderAmount: 150,
    maxDiscount: 100,
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usedCount: 0,
    stackable: false,
    priority: 3,
    source: 'promo',
  },
  {
    id: 'coupon-4',
    code: 'VIERNES2X1',
    type: 'bogo',
    value: 50,
    description: '2x1 en productos seleccionados los viernes',
    termsAndConditions: [
      'Valido solo los viernes',
      'Aplica al producto de menor valor',
      'Maximo 1 uso por pedido',
    ],
    dayOfWeek: [5], // Viernes
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usedCount: 0,
    userUsageLimit: 1,
    stackable: false,
    priority: 1,
    source: 'special',
  },
  {
    id: 'coupon-5',
    code: 'HAPPY100',
    type: 'fixed',
    value: 100,
    description: '$100 de descuento en Happy Hour',
    termsAndConditions: [
      'Valido de 3pm a 6pm',
      'Pedido minimo de $300',
    ],
    minOrderAmount: 300,
    timeRange: { start: '15:00', end: '18:00' },
    validFrom: new Date('2024-01-01'),
    validUntil: new Date('2025-12-31'),
    usedCount: 0,
    stackable: false,
    priority: 2,
    source: 'promo',
  },
];

export const useCouponsStore = create<CouponsState>()(
  persist(
    (set, get) => ({
      availableCoupons: MOCK_COUPONS,
      userCoupons: [],
      appliedCoupon: null,

      fetchAvailableCoupons: async () => {
        // En produccion, esto seria una llamada al backend
        // Por ahora usamos los cupones de ejemplo
        set({ availableCoupons: MOCK_COUPONS });
      },

      claimCoupon: async (code: string) => {
        const state = get();
        const upperCode = code.toUpperCase().trim();

        // Buscar el cupon
        const coupon = state.availableCoupons.find(
          (c) => c.code.toUpperCase() === upperCode
        );

        if (!coupon) {
          return {
            valid: false,
            message: 'Codigo de cupon invalido',
          };
        }

        // Verificar si ya lo tiene el usuario
        const alreadyClaimed = state.userCoupons.some(
          (c) => c.code.toUpperCase() === upperCode && !c.usedAt
        );

        if (alreadyClaimed) {
          return {
            valid: false,
            message: 'Ya tienes este cupon',
          };
        }

        // Verificar vigencia
        const now = new Date();
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
          return {
            valid: false,
            message: 'Este cupon ha expirado o aun no es valido',
          };
        }

        // Agregar a cupones del usuario
        const userCoupon: UserCoupon = {
          ...coupon,
          claimedAt: new Date(),
        };

        set((state) => ({
          userCoupons: [userCoupon, ...state.userCoupons],
        }));

        return {
          valid: true,
          message: 'Cupon agregado correctamente!',
          coupon,
        };
      },

      validateCoupon: (code, orderTotal, restaurantId, productIds, isFirstOrder) => {
        const state = get();
        const upperCode = code.toUpperCase().trim();

        // Buscar en cupones del usuario primero
        let coupon = state.userCoupons.find(
          (c) => c.code.toUpperCase() === upperCode && !c.usedAt
        );

        // Si no lo tiene, buscar en disponibles
        if (!coupon) {
          const availableCoupon = state.availableCoupons.find(
            (c) => c.code.toUpperCase() === upperCode
          );
          if (availableCoupon) {
            coupon = { ...availableCoupon, claimedAt: new Date() };
          }
        }

        if (!coupon) {
          return { valid: false, message: 'Codigo invalido' };
        }

        // Verificar vigencia
        const now = new Date();
        if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
          return { valid: false, message: 'Cupon expirado' };
        }

        // Verificar monto minimo
        if (coupon.minOrderAmount && orderTotal < coupon.minOrderAmount) {
          return {
            valid: false,
            message: `Pedido minimo de $${coupon.minOrderAmount}`,
          };
        }

        // Verificar primer pedido
        if (coupon.firstOrderOnly && !isFirstOrder) {
          return { valid: false, message: 'Solo valido para primer pedido' };
        }

        // Verificar dia de la semana
        if (coupon.dayOfWeek && !coupon.dayOfWeek.includes(now.getDay())) {
          const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
          const validDays = coupon.dayOfWeek.map((d) => days[d]).join(', ');
          return { valid: false, message: `Solo valido los ${validDays}` };
        }

        // Verificar horario
        if (coupon.timeRange) {
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          if (currentTime < coupon.timeRange.start || currentTime > coupon.timeRange.end) {
            return {
              valid: false,
              message: `Valido de ${coupon.timeRange.start} a ${coupon.timeRange.end}`,
            };
          }
        }

        // Verificar restaurante
        if (coupon.applicableRestaurants && restaurantId) {
          if (!coupon.applicableRestaurants.includes(restaurantId)) {
            return { valid: false, message: 'No valido en este restaurante' };
          }
        }

        // Calcular descuento
        let discount = 0;
        switch (coupon.type) {
          case 'percentage':
            discount = (orderTotal * coupon.value) / 100;
            if (coupon.maxDiscount) {
              discount = Math.min(discount, coupon.maxDiscount);
            }
            break;
          case 'fixed':
            discount = coupon.value;
            break;
          case 'free_delivery':
            discount = 0; // Se aplica al delivery fee
            break;
          case 'bogo':
            discount = (orderTotal * coupon.value) / 100;
            break;
          case 'free_item':
            discount = 0; // Se maneja por separado
            break;
        }

        return {
          valid: true,
          message: 'Cupon aplicado!',
          discount,
          coupon,
        };
      },

      applyCoupon: (coupon) => {
        set({ appliedCoupon: coupon });
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
      },

      useCoupon: (couponId, orderId) => {
        set((state) => ({
          userCoupons: state.userCoupons.map((c) =>
            c.id === couponId ? { ...c, usedAt: new Date(), orderId } : c
          ),
          appliedCoupon: null,
        }));
      },

      calculateDiscount: (orderTotal, deliveryFee) => {
        const { appliedCoupon } = get();
        if (!appliedCoupon) return 0;

        switch (appliedCoupon.type) {
          case 'percentage':
            let discount = (orderTotal * appliedCoupon.value) / 100;
            if (appliedCoupon.maxDiscount) {
              discount = Math.min(discount, appliedCoupon.maxDiscount);
            }
            return discount;
          case 'fixed':
            return appliedCoupon.value;
          case 'free_delivery':
            return deliveryFee;
          case 'bogo':
            return (orderTotal * appliedCoupon.value) / 100;
          default:
            return 0;
        }
      },

      getUserCoupons: () => {
        return get().userCoupons;
      },

      getActiveCoupons: () => {
        const now = new Date();
        return get().userCoupons.filter(
          (c) => !c.usedAt && new Date(c.validUntil) > now
        );
      },
    }),
    {
      name: 'coupons-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Helper para mostrar el valor del cupon
export const formatCouponValue = (coupon: Coupon): string => {
  switch (coupon.type) {
    case 'percentage':
      return `${coupon.value}% OFF`;
    case 'fixed':
      return `$${coupon.value} OFF`;
    case 'free_delivery':
      return 'Envio Gratis';
    case 'bogo':
      return '2x1';
    case 'free_item':
      return 'Item Gratis';
    default:
      return 'Descuento';
  }
};

// Helper para obtener el color del badge del cupon
export const getCouponColor = (source: Coupon['source']): string => {
  const colors = {
    promo: '#FF6B35',
    referral: '#4CAF50',
    loyalty: '#FFD700',
    special: '#9C27B0',
    birthday: '#E91E63',
  };
  return colors[source] || '#FF6B35';
};
