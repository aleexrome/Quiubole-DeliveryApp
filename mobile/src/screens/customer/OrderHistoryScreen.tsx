// ==========================================
// DEVOLÓN — Order History
//
// Listado de pedidos con filtros pill (todos/activos/completados) + cards
// glass con status chip dot+texto, totales en amarillo, acciones (rastrear,
// calificar, repetir) como pills outline amarillas. Empty state premium.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Order, OrderStatus } from '../../types';
import { Card, EmptyState, Header } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

// ============ Status Config ============
type StatusConfig = { label: string; color: string; icon: keyof typeof Ionicons.glyphMap };

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: { label: 'Pendiente', color: colors.warning, icon: 'time-outline' },
  confirmed: { label: 'Confirmado', color: colors.info, icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparando', color: colors.info, icon: 'restaurant-outline' },
  ready_for_pickup: { label: 'Listo', color: colors.info, icon: 'bag-check-outline' },
  driver_assigned: { label: 'Asignado', color: colors.primary, icon: 'bicycle-outline' },
  picked_up: { label: 'Recogido', color: colors.primary, icon: 'navigate-outline' },
  on_the_way: { label: 'En camino', color: colors.primary, icon: 'navigate-outline' },
  delivered: { label: 'Entregado', color: colors.success, icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Cancelado', color: colors.danger, icon: 'close-circle-outline' },
};

// ============ Mock Orders ============
const MOCK_ORDERS: Partial<Order>[] = [
  {
    id: '1',
    orderNumber: 'DVL-001234',
    status: 'delivered',
    total: 245.5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60),
    restaurant: {
      id: '1',
      name: 'Tacos El Patrón',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Tacos al Pastor' } as any, quantity: 3 } as any,
      { id: '2', product: { name: 'Agua de Horchata' } as any, quantity: 2 } as any,
    ],
  },
  {
    id: '2',
    orderNumber: 'DVL-001233',
    status: 'on_the_way',
    total: 189.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    restaurant: {
      id: '2',
      name: 'Pizza Napoli',
      logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    } as any,
    items: [{ id: '1', product: { name: 'Pizza Margherita' } as any, quantity: 1 } as any],
  },
  {
    id: '3',
    orderNumber: 'DVL-001230',
    status: 'delivered',
    total: 320.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45),
    restaurant: {
      id: '3',
      name: 'Burger Master',
      logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Burger Clásica' } as any, quantity: 2 } as any,
      { id: '2', product: { name: 'Papas Fritas' } as any, quantity: 1 } as any,
    ],
  },
  {
    id: '4',
    orderNumber: 'DVL-001225',
    status: 'cancelled',
    total: 150.0,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    cancelledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 10),
    cancellationReason: 'Restaurante cerrado',
    restaurant: {
      id: '4',
      name: 'Sushi Sakura',
      logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200',
    } as any,
    items: [{ id: '1', product: { name: 'Roll California' } as any, quantity: 2 } as any],
  },
];

type FilterType = 'all' | 'active' | 'completed';

const FilterPill = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterPill, active && styles.filterPillActive]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const formatDate = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `Hace ${mins} min`;
  if (hrs < 24) return `Hace ${hrs}h`;
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
};

const OrderCard = ({
  order,
  onPress,
  onReorder,
  onTrack,
  onRate,
}: {
  order: Partial<Order>;
  onPress: () => void;
  onReorder: () => void;
  onTrack: () => void;
  onRate: () => void;
}) => {
  const statusConfig = STATUS_CONFIG[order.status as OrderStatus];
  const isActive = [
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'driver_assigned',
    'picked_up',
    'on_the_way',
  ].includes(order.status!);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <Card
      variant="glass"
      onPress={onPress}
      padding={s.lg}
      borderRadius={radius.xl}
      style={styles.orderCard}
    >
      {/* Header */}
      <View style={styles.orderHeader}>
        <Image source={{ uri: order.restaurant?.logo }} style={styles.restaurantLogo} />
        <View style={styles.orderHeaderInfo}>
          <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <View style={styles.statusChip}>
          <View style={[styles.statusDot, { backgroundColor: statusConfig.color }]} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Items */}
      <Text style={styles.itemsText} numberOfLines={1}>
        {order.items?.map((item) => `${item.quantity}× ${item.product.name}`).join(', ')}
      </Text>

      {/* Meta */}
      <View style={styles.orderMeta}>
        <Text style={styles.orderDate}>{formatDate(order.createdAt!)}</Text>
        <Text style={styles.orderTotal}>${(Number(order.total) || 0).toFixed(2)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.orderActions}>
        {isActive && (
          <TouchableOpacity style={styles.actionPill} onPress={onTrack} activeOpacity={0.85}>
            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
            <Text style={styles.actionText}>Rastrear</Text>
          </TouchableOpacity>
        )}
        {isDelivered && (
          <>
            <TouchableOpacity style={styles.actionPill} onPress={onRate} activeOpacity={0.85}>
              <Ionicons name="star-outline" size={14} color={colors.primary} />
              <Text style={styles.actionText}>Calificar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionPill} onPress={onReorder} activeOpacity={0.85}>
              <Ionicons name="refresh-outline" size={14} color={colors.primary} />
              <Text style={styles.actionText}>Repetir</Text>
            </TouchableOpacity>
          </>
        )}
        {isCancelled && (
          <TouchableOpacity style={styles.actionPill} onPress={onReorder} activeOpacity={0.85}>
            <Ionicons name="refresh-outline" size={14} color={colors.primary} />
            <Text style={styles.actionText}>Volver a pedir</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Cancellation reason */}
      {isCancelled && order.cancellationReason && (
        <View style={styles.cancelReason}>
          <Ionicons name="information-circle-outline" size={13} color={colors.danger} />
          <Text style={styles.cancelReasonText}>{order.cancellationReason}</Text>
        </View>
      )}
    </Card>
  );
};

export default function OrderHistoryScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Partial<Order>[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setOrders(MOCK_ORDERS);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return [
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'driver_assigned',
        'picked_up',
        'on_the_way',
      ].includes(order.status!);
    }
    if (filter === 'completed') {
      return ['delivered', 'cancelled'].includes(order.status!);
    }
    return true;
  });

  const handleOrderPress = (order: Partial<Order>) => {
    navigation.navigate('OrderDetail', { orderId: order.id });
  };

  const handleTrack = (order: Partial<Order>) => {
    navigation.navigate('OrderTracking', { orderId: order.id });
  };

  const handleReorder = (order: Partial<Order>) => {
    navigation.navigate('RestaurantDetail', { restaurantId: order.restaurant?.id });
  };

  const handleRate = (order: Partial<Order>) => {
    navigation.navigate('RateOrder', { orderId: order.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Historial" eyebrow="MIS PEDIDOS" />

      {/* Filters */}
      <View style={styles.filtersRow}>
        <FilterPill
          label="Todos"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterPill
          label="Activos"
          active={filter === 'active'}
          onPress={() => setFilter('active')}
        />
        <FilterPill
          label="Completados"
          active={filter === 'completed'}
          onPress={() => setFilter('completed')}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id!}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() => handleOrderPress(item)}
              onTrack={() => handleTrack(item)}
              onReorder={() => handleReorder(item)}
              onRate={() => handleRate(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="Sin pedidos"
              subtitle={
                filter === 'active'
                  ? 'No tienes pedidos activos en este momento.'
                  : filter === 'completed'
                  ? 'Aún no has completado pedidos.'
                  : 'Cuando hagas tu primer pedido, lo verás aquí.'
              }
              actionLabel="EXPLORAR"
              onAction={() => navigation.navigate('Home')}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ FILTERS ============
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: s.xl,
    paddingVertical: s.sm,
    gap: s.xs,
  },
  filterPill: {
    paddingHorizontal: s.md,
    paddingVertical: s.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  filterTextActive: { color: colors.primary },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s['3xl'],
  },

  // ============ ORDER CARD ============
  orderCard: {
    marginBottom: s.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  restaurantLogo: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderHeaderInfo: { flex: 1 },
  restaurantName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  orderNumber: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  itemsText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: s.md,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s.sm,
  },
  orderDate: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  orderTotal: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  orderActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
    marginTop: s.md,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
  },
  actionText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  cancelReason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: s.sm,
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    backgroundColor: 'rgba(229,72,77,0.10)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.25)',
  },
  cancelReasonText: {
    flex: 1,
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
