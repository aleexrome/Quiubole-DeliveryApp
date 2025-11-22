// ==========================================
// ORDERS SCREEN (TAB) - PEDIDOS DEL CLIENTE
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Order, OrderStatus } from '../../types';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  danger: '#F44336',
};

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

// Mock de pedidos activos
const MOCK_ACTIVE_ORDERS: Partial<Order>[] = [
  {
    id: '1',
    orderNumber: 'QUB-001235',
    status: 'preparing',
    total: 189.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    restaurant: {
      id: '1',
      name: 'Tacos El Patron',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Tacos al Pastor' } as any, quantity: 3 } as any,
    ],
  },
];

// Mock de pedidos pasados
const MOCK_PAST_ORDERS: Partial<Order>[] = [
  {
    id: '2',
    orderNumber: 'QUB-001234',
    status: 'delivered',
    total: 245.50,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    restaurant: {
      id: '1',
      name: 'Tacos El Patron',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Tacos al Pastor' } as any, quantity: 3 } as any,
    ],
  },
  {
    id: '3',
    orderNumber: 'QUB-001230',
    status: 'delivered',
    total: 320.00,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    restaurant: {
      id: '2',
      name: 'Pizza Napoli',
      logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    } as any,
    items: [
      { id: '1', product: { name: 'Pizza Margherita' } as any, quantity: 1 } as any,
    ],
  },
];

const formatDate = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `Hace ${minutes} min`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days} dia${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-MX');
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [activeOrders, setActiveOrders] = useState<Partial<Order>[]>(MOCK_ACTIVE_ORDERS);
  const [pastOrders, setPastOrders] = useState<Partial<Order>[]>(MOCK_PAST_ORDERS);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleOrderPress = (order: Partial<Order>) => {
    const isActive = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'driver_assigned', 'picked_up', 'on_the_way'].includes(order.status!);
    if (isActive) {
      navigation.navigate('OrderTracking', { orderId: order.id });
    } else {
      navigation.navigate('OrderHistory');
    }
  };

  const renderActiveOrder = (order: Partial<Order>) => {
    const statusConfig = STATUS_CONFIG[order.status as OrderStatus];
    return (
      <TouchableOpacity
        key={order.id}
        style={styles.activeOrderCard}
        onPress={() => handleOrderPress(order)}
      >
        <View style={styles.activeOrderHeader}>
          <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />
          <View style={styles.activeOrderInfo}>
            <Text style={styles.restaurantName}>{order.restaurant?.name}</Text>
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
          <TouchableOpacity style={styles.trackButton}>
            <Text style={styles.trackButtonText}>Rastrear</Text>
            <Ionicons name="navigate" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.orderProgress}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: getProgressWidth(order.status!) }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Pedido</Text>
            <Text style={styles.progressLabel}>Preparando</Text>
            <Text style={styles.progressLabel}>En camino</Text>
            <Text style={styles.progressLabel}>Entregado</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getProgressWidth = (status: string): string => {
    const progressMap: Record<string, string> = {
      pending: '10%',
      confirmed: '25%',
      preparing: '40%',
      ready_for_pickup: '55%',
      driver_assigned: '60%',
      picked_up: '70%',
      on_the_way: '85%',
      delivered: '100%',
    };
    return progressMap[status] || '0%';
  };

  const renderPastOrder = ({ item }: { item: Partial<Order> }) => (
    <TouchableOpacity style={styles.pastOrderCard} onPress={() => handleOrderPress(item)}>
      <Image source={{ uri: item.restaurant?.logo }} style={styles.pastOrderImage} />
      <View style={styles.pastOrderInfo}>
        <Text style={styles.pastOrderName}>{item.restaurant?.name}</Text>
        <Text style={styles.pastOrderItems}>
          {item.items?.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
        </Text>
        <View style={styles.pastOrderMeta}>
          <Text style={styles.pastOrderDate}>{formatDate(item.createdAt!)}</Text>
          <Text style={styles.pastOrderTotal}>${item.total?.toFixed(2)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
      </View>

      <FlatList
        data={pastOrders}
        keyExtractor={item => item.id!}
        renderItem={renderPastOrder}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
        ListHeaderComponent={
          <>
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pedidos activos</Text>
                {activeOrders.map(renderActiveOrder)}
              </View>
            )}

            {/* Past Orders Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pedidos anteriores</Text>
              <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')}>
                <Text style={styles.viewAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyTitle}>Sin pedidos</Text>
            <Text style={styles.emptySubtitle}>Tus pedidos apareceran aqui</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  activeOrderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  activeOrderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeOrderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  trackButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.white,
  },
  orderProgress: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 10,
    color: COLORS.gray,
  },
  pastOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  pastOrderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  pastOrderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  pastOrderName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  pastOrderItems: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  pastOrderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  pastOrderDate: {
    fontSize: 12,
    color: COLORS.gray,
  },
  pastOrderTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
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
    marginTop: 4,
  },
});
