// ==========================================
// ORDER HISTORY SCREEN - HISTORIAL DE PEDIDOS
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

// Colores de la marca
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  textLight: '#6C757D',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  info: '#2196F3',
};

// Status configs
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendiente', color: COLORS.warning, icon: 'time-outline' },
  confirmed: { label: 'Confirmado', color: COLORS.info, icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparando', color: COLORS.info, icon: 'restaurant-outline' },
  ready_for_pickup: { label: 'Listo', color: COLORS.info, icon: 'bag-check-outline' },
  driver_assigned: { label: 'Repartidor asignado', color: COLORS.info, icon: 'bicycle-outline' },
  picked_up: { label: 'Recogido', color: COLORS.primary, icon: 'navigate-outline' },
  on_the_way: { label: 'En camino', color: COLORS.primary, icon: 'navigate-outline' },
  delivered: { label: 'Entregado', color: COLORS.success, icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Cancelado', color: COLORS.danger, icon: 'close-circle-outline' },
};

// Mock orders data
const MOCK_ORDERS: Partial<Order>[] = [
  {
    id: '1',
    orderNumber: 'QUB-001234',
    status: 'delivered',
    total: 245.50,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60),
    restaurant: {
      id: '1',
      name: 'Tacos El Patron',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Tacos al Pastor' } as any, quantity: 3 } as any,
      { id: '2', product: { name: 'Agua de Horchata' } as any, quantity: 2 } as any,
    ],
  },
  {
    id: '2',
    orderNumber: 'QUB-001233',
    status: 'on_the_way',
    total: 189.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    restaurant: {
      id: '2',
      name: 'Pizza Napoli',
      logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Pizza Margherita' } as any, quantity: 1 } as any,
    ],
  },
  {
    id: '3',
    orderNumber: 'QUB-001230',
    status: 'delivered',
    total: 320.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 45),
    restaurant: {
      id: '3',
      name: 'Burger Master',
      logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Burger Clasica' } as any, quantity: 2 } as any,
      { id: '2', product: { name: 'Papas Fritas' } as any, quantity: 1 } as any,
    ],
  },
  {
    id: '4',
    orderNumber: 'QUB-001225',
    status: 'cancelled',
    total: 150.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    cancelledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 1000 * 60 * 10),
    cancellationReason: 'Restaurante cerrado',
    restaurant: {
      id: '4',
      name: 'Sushi Sakura',
      logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Roll California' } as any, quantity: 2 } as any,
    ],
  },
];

type FilterType = 'all' | 'active' | 'completed';

const FilterButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    style={[styles.filterButton, active && styles.filterButtonActive]}
    onPress={onPress}
  >
    <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
  </TouchableOpacity>
);

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (days < 7) return `Hace ${days} dia${days > 1 ? 's' : ''}`;
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
  const isActive = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'driver_assigned', 'picked_up', 'on_the_way'].includes(order.status!);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      {/* Header */}
      <View style={styles.orderHeader}>
        <Image source={{ uri: order.restaurant?.logo }} style={styles.restaurantLogo} />
        <View style={styles.orderHeaderInfo}>
          <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${statusConfig.color}20` }]}>
          <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} />
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.orderItems}>
        <Text style={styles.itemsText} numberOfLines={1}>
          {order.items?.map(item => `${item.quantity}x ${item.product.name}`).join(', ')}
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.orderFooter}>
        <View style={styles.orderMeta}>
          <Text style={styles.orderDate}>{formatDate(order.createdAt!)}</Text>
          <Text style={styles.orderTotal}>${order.total?.toFixed(2)}</Text>
        </View>

        {/* Actions */}
        <View style={styles.orderActions}>
          {isActive && (
            <TouchableOpacity style={styles.actionButton} onPress={onTrack}>
              <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionText}>Rastrear</Text>
            </TouchableOpacity>
          )}
          {isDelivered && (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={onRate}>
                <Ionicons name="star-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionText}>Calificar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onReorder}>
                <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
                <Text style={styles.actionText}>Repetir</Text>
              </TouchableOpacity>
            </>
          )}
          {isCancelled && (
            <TouchableOpacity style={styles.actionButton} onPress={onReorder}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
              <Text style={styles.actionText}>Volver a pedir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cancellation reason */}
      {isCancelled && order.cancellationReason && (
        <View style={styles.cancelReason}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.danger} />
          <Text style={styles.cancelReasonText}>{order.cancellationReason}</Text>
        </View>
      )}
    </TouchableOpacity>
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
      // TODO: Fetch from API
      await new Promise(resolve => setTimeout(resolve, 500));
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

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'active') {
      return ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'driver_assigned', 'picked_up', 'on_the_way'].includes(order.status!);
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
    // TODO: Implementar reordenar
    navigation.navigate('RestaurantDetail', { restaurantId: order.restaurant?.id });
  };

  const handleRate = (order: Partial<Order>) => {
    navigation.navigate('RateOrder', { orderId: order.id });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="receipt-outline" size={64} color={COLORS.lightGray} />
      <Text style={styles.emptyTitle}>Sin pedidos</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'active'
          ? 'No tienes pedidos activos'
          : filter === 'completed'
          ? 'No tienes pedidos completados'
          : 'Aun no has realizado ningun pedido'}
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.exploreButtonText}>Explorar restaurantes</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FilterButton
          label="Todos"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterButton
          label="Activos"
          active={filter === 'active'}
          onPress={() => setFilter('active')}
        />
        <FilterButton
          label="Completados"
          active={filter === 'completed'}
          onPress={() => setFilter('completed')}
        />
      </View>

      {/* Orders List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={item => item.id!}
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
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  orderHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderNumber: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderItems: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  itemsText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  orderFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  orderActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 8,
    gap: 4,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  cancelReason: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 10,
    backgroundColor: `${COLORS.danger}10`,
    borderRadius: 8,
    gap: 6,
  },
  cancelReasonText: {
    fontSize: 12,
    color: COLORS.danger,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
