// ==========================================
// GROUP ORDER STORE - PEDIDOS GRUPALES
// ==========================================

import { create } from 'zustand';

interface GroupMember {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
  items: GroupOrderItem[];
  subtotal: number;
  isReady: boolean;
  joinedAt: Date;
}

interface GroupOrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  options?: string[];
  notes?: string;
  memberId: string;
}

interface GroupOrder {
  id: string;
  code: string;
  restaurantId: string;
  restaurantName: string;
  restaurantImage?: string;
  hostId: string;
  members: GroupMember[];
  status: 'open' | 'locked' | 'ordered' | 'completed';
  createdAt: Date;
  expiresAt: Date;
  deliveryAddress?: string;
  splitMethod: 'equal' | 'individual';
  totalAmount: number;
}

interface GroupOrderState {
  activeGroupOrder: GroupOrder | null;
  joinedGroups: GroupOrder[];

  // Actions
  createGroupOrder: (restaurantId: string, restaurantName: string, restaurantImage?: string) => GroupOrder;
  joinGroupOrder: (code: string, memberName: string) => boolean;
  leaveGroupOrder: () => void;
  addItemToGroup: (item: Omit<GroupOrderItem, 'id' | 'memberId'>) => void;
  removeItemFromGroup: (itemId: string) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  setMemberReady: (memberId: string, isReady: boolean) => void;
  lockGroupOrder: () => void;
  setSplitMethod: (method: 'equal' | 'individual') => void;
  getGroupOrderByCode: (code: string) => GroupOrder | null;
  calculateMemberTotal: (memberId: string) => number;
}

// Generar codigo de grupo
const generateGroupCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Simular usuario actual (en produccion vendria del authStore)
const getCurrentUserId = () => 'current-user-id';
const getCurrentUserName = () => 'Tu';

export const useGroupOrderStore = create<GroupOrderState>((set, get) => ({
  activeGroupOrder: null,
  joinedGroups: [],

  createGroupOrder: (restaurantId, restaurantName, restaurantImage) => {
    const userId = getCurrentUserId();
    const userName = getCurrentUserName();

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // Expira en 2 horas

    const newGroup: GroupOrder = {
      id: `group-${Date.now()}`,
      code: generateGroupCode(),
      restaurantId,
      restaurantName,
      restaurantImage,
      hostId: userId,
      members: [
        {
          id: userId,
          name: userName,
          isHost: true,
          items: [],
          subtotal: 0,
          isReady: false,
          joinedAt: new Date(),
        },
      ],
      status: 'open',
      createdAt: new Date(),
      expiresAt,
      splitMethod: 'individual',
      totalAmount: 0,
    };

    set({ activeGroupOrder: newGroup });
    return newGroup;
  },

  joinGroupOrder: (code, memberName) => {
    const state = get();
    // En produccion, esto verificaria con el backend
    // Por ahora simulamos encontrar el grupo

    const userId = getCurrentUserId();

    if (state.activeGroupOrder?.code === code) {
      // Ya estamos en este grupo
      return true;
    }

    // Simular unirse a un grupo existente
    const mockGroup: GroupOrder = {
      id: `group-${Date.now()}`,
      code,
      restaurantId: 'restaurant-1',
      restaurantName: 'Tacos El Primo',
      hostId: 'host-user',
      members: [
        {
          id: 'host-user',
          name: 'Anfitrion',
          isHost: true,
          items: [],
          subtotal: 0,
          isReady: false,
          joinedAt: new Date(Date.now() - 300000),
        },
        {
          id: userId,
          name: memberName,
          isHost: false,
          items: [],
          subtotal: 0,
          isReady: false,
          joinedAt: new Date(),
        },
      ],
      status: 'open',
      createdAt: new Date(Date.now() - 300000),
      expiresAt: new Date(Date.now() + 6900000),
      splitMethod: 'individual',
      totalAmount: 0,
    };

    set({ activeGroupOrder: mockGroup });
    return true;
  },

  leaveGroupOrder: () => {
    set({ activeGroupOrder: null });
  },

  addItemToGroup: (item) => {
    const state = get();
    if (!state.activeGroupOrder) return;

    const userId = getCurrentUserId();
    const newItem: GroupOrderItem = {
      ...item,
      id: `item-${Date.now()}`,
      memberId: userId,
    };

    set((state) => {
      if (!state.activeGroupOrder) return state;

      const updatedMembers = state.activeGroupOrder.members.map((member) => {
        if (member.id === userId) {
          const updatedItems = [...member.items, newItem];
          const subtotal = updatedItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
          return { ...member, items: updatedItems, subtotal };
        }
        return member;
      });

      const totalAmount = updatedMembers.reduce((sum, m) => sum + m.subtotal, 0);

      return {
        activeGroupOrder: {
          ...state.activeGroupOrder,
          members: updatedMembers,
          totalAmount,
        },
      };
    });
  },

  removeItemFromGroup: (itemId) => {
    const userId = getCurrentUserId();

    set((state) => {
      if (!state.activeGroupOrder) return state;

      const updatedMembers = state.activeGroupOrder.members.map((member) => {
        if (member.id === userId) {
          const updatedItems = member.items.filter((i) => i.id !== itemId);
          const subtotal = updatedItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
          return { ...member, items: updatedItems, subtotal };
        }
        return member;
      });

      const totalAmount = updatedMembers.reduce((sum, m) => sum + m.subtotal, 0);

      return {
        activeGroupOrder: {
          ...state.activeGroupOrder,
          members: updatedMembers,
          totalAmount,
        },
      };
    });
  },

  updateItemQuantity: (itemId, quantity) => {
    const userId = getCurrentUserId();

    set((state) => {
      if (!state.activeGroupOrder) return state;

      const updatedMembers = state.activeGroupOrder.members.map((member) => {
        if (member.id === userId) {
          const updatedItems = member.items.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          );
          const subtotal = updatedItems.reduce(
            (sum, i) => sum + i.price * i.quantity,
            0
          );
          return { ...member, items: updatedItems, subtotal };
        }
        return member;
      });

      const totalAmount = updatedMembers.reduce((sum, m) => sum + m.subtotal, 0);

      return {
        activeGroupOrder: {
          ...state.activeGroupOrder,
          members: updatedMembers,
          totalAmount,
        },
      };
    });
  },

  setMemberReady: (memberId, isReady) => {
    set((state) => {
      if (!state.activeGroupOrder) return state;

      const updatedMembers = state.activeGroupOrder.members.map((member) =>
        member.id === memberId ? { ...member, isReady } : member
      );

      return {
        activeGroupOrder: {
          ...state.activeGroupOrder,
          members: updatedMembers,
        },
      };
    });
  },

  lockGroupOrder: () => {
    set((state) => {
      if (!state.activeGroupOrder) return state;
      return {
        activeGroupOrder: {
          ...state.activeGroupOrder,
          status: 'locked',
        },
      };
    });
  },

  setSplitMethod: (method) => {
    set((state) => {
      if (!state.activeGroupOrder) return state;
      return {
        activeGroupOrder: {
          ...state.activeGroupOrder,
          splitMethod: method,
        },
      };
    });
  },

  getGroupOrderByCode: (code) => {
    const state = get();
    if (state.activeGroupOrder?.code === code) {
      return state.activeGroupOrder;
    }
    return state.joinedGroups.find((g) => g.code === code) || null;
  },

  calculateMemberTotal: (memberId) => {
    const state = get();
    if (!state.activeGroupOrder) return 0;

    if (state.activeGroupOrder.splitMethod === 'equal') {
      const memberCount = state.activeGroupOrder.members.length;
      return state.activeGroupOrder.totalAmount / memberCount;
    }

    const member = state.activeGroupOrder.members.find((m) => m.id === memberId);
    return member?.subtotal || 0;
  },
}));
