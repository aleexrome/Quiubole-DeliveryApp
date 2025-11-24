// ==========================================
// QUIUPOINTS STORE - PROGRAMA DE LEALTAD
// ==========================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PointsTransaction {
  id: string;
  type: 'earn' | 'redeem';
  amount: number;
  description: string;
  orderId?: string;
  rewardId?: string;
  createdAt: Date;
}

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'free_delivery' | 'free_item' | 'cashback';
  value: number; // Porcentaje o cantidad fija
  minOrderAmount?: number;
  expiresInDays: number;
  icon: string;
}

interface RedeemedReward {
  id: string;
  reward: Reward;
  code: string;
  redeemedAt: Date;
  expiresAt: Date;
  usedAt?: Date;
  orderId?: string;
}

interface PointsState {
  totalPoints: number;
  lifetimePoints: number;
  transactions: PointsTransaction[];
  redeemedRewards: RedeemedReward[];

  // Actions
  earnPoints: (amount: number, description: string, orderId?: string) => void;
  redeemReward: (reward: Reward) => RedeemedReward | null;
  useReward: (rewardCode: string, orderId: string) => boolean;
  getAvailableRewards: () => RedeemedReward[];
  getPointsHistory: () => PointsTransaction[];
  calculatePointsForOrder: (orderTotal: number) => number;
}

// Recompensas disponibles
export const AVAILABLE_REWARDS: Reward[] = [
  {
    id: 'reward-1',
    name: 'Envio Gratis',
    description: 'En tu proximo pedido',
    pointsCost: 100,
    type: 'free_delivery',
    value: 100, // 100% descuento en envio
    icon: '🚴',
    expiresInDays: 30,
  },
  {
    id: 'reward-2',
    name: '10% Descuento',
    description: 'En pedidos mayores a $150',
    pointsCost: 200,
    type: 'discount',
    value: 10,
    minOrderAmount: 150,
    icon: '🎟️',
    expiresInDays: 30,
  },
  {
    id: 'reward-3',
    name: '20% Descuento',
    description: 'En pedidos mayores a $200',
    pointsCost: 350,
    type: 'discount',
    value: 20,
    minOrderAmount: 200,
    icon: '🎫',
    expiresInDays: 30,
  },
  {
    id: 'reward-4',
    name: '$50 de Descuento',
    description: 'En pedidos mayores a $250',
    pointsCost: 500,
    type: 'cashback',
    value: 50,
    minOrderAmount: 250,
    icon: '💰',
    expiresInDays: 30,
  },
  {
    id: 'reward-5',
    name: 'Postre Gratis',
    description: 'En restaurantes participantes',
    pointsCost: 150,
    type: 'free_item',
    value: 1,
    icon: '🍰',
    expiresInDays: 14,
  },
];

// Generar codigo de recompensa
const generateRewardCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'QUIU-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const usePointsStore = create<PointsState>()(
  persist(
    (set, get) => ({
      totalPoints: 0,
      lifetimePoints: 0,
      transactions: [],
      redeemedRewards: [],

      earnPoints: (amount, description, orderId) => {
        const transaction: PointsTransaction = {
          id: `txn-${Date.now()}`,
          type: 'earn',
          amount,
          description,
          orderId,
          createdAt: new Date(),
        };

        set((state) => ({
          totalPoints: state.totalPoints + amount,
          lifetimePoints: state.lifetimePoints + amount,
          transactions: [transaction, ...state.transactions].slice(0, 100), // Mantener ultimas 100
        }));
      },

      redeemReward: (reward) => {
        const state = get();
        if (state.totalPoints < reward.pointsCost) {
          return null; // No tiene suficientes puntos
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + reward.expiresInDays);

        const redeemedReward: RedeemedReward = {
          id: `redeemed-${Date.now()}`,
          reward,
          code: generateRewardCode(),
          redeemedAt: new Date(),
          expiresAt,
        };

        const transaction: PointsTransaction = {
          id: `txn-${Date.now()}`,
          type: 'redeem',
          amount: -reward.pointsCost,
          description: `Canjeo: ${reward.name}`,
          rewardId: redeemedReward.id,
          createdAt: new Date(),
        };

        set((state) => ({
          totalPoints: state.totalPoints - reward.pointsCost,
          transactions: [transaction, ...state.transactions].slice(0, 100),
          redeemedRewards: [redeemedReward, ...state.redeemedRewards],
        }));

        return redeemedReward;
      },

      useReward: (rewardCode, orderId) => {
        const state = get();
        const rewardIndex = state.redeemedRewards.findIndex(
          (r) => r.code === rewardCode && !r.usedAt
        );

        if (rewardIndex === -1) {
          return false;
        }

        const reward = state.redeemedRewards[rewardIndex];
        if (new Date() > new Date(reward.expiresAt)) {
          return false; // Expirada
        }

        set((state) => ({
          redeemedRewards: state.redeemedRewards.map((r, i) =>
            i === rewardIndex ? { ...r, usedAt: new Date(), orderId } : r
          ),
        }));

        return true;
      },

      getAvailableRewards: () => {
        const state = get();
        const now = new Date();
        return state.redeemedRewards.filter(
          (r) => !r.usedAt && new Date(r.expiresAt) > now
        );
      },

      getPointsHistory: () => {
        return get().transactions;
      },

      calculatePointsForOrder: (orderTotal) => {
        // 1 punto por cada $10 gastados
        return Math.floor(orderTotal / 10);
      },
    }),
    {
      name: 'quiupoints-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Hook helper
export const useQuiuPoints = () => {
  const store = usePointsStore();
  return {
    points: store.totalPoints,
    lifetimePoints: store.lifetimePoints,
    earnPoints: store.earnPoints,
    redeemReward: store.redeemReward,
    availableRewards: store.getAvailableRewards(),
    history: store.getPointsHistory(),
    calculatePoints: store.calculatePointsForOrder,
  };
};
