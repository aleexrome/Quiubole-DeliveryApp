// ==========================================
// MONITOR DE PEDIDOS (ADMIN)
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ordersApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pendiente', color: '#FF6B35', bgColor: '#FFF5F0' },
  confirmed: { label: 'Confirmado', color: '#3B82F6', bgColor: '#EFF6FF' },
  preparing: { label: 'Preparando', color: '#EAB308', bgColor: '#FEFCE8' },
  ready_for_pickup: { label: 'Listo', color: '#22C55E', bgColor: '#F0FDF4' },
  driver_assigned: { label: 'Repartidor asignado', color: '#8B5CF6', bgColor: '#F5F3FF' },
  picked_up: { label: 'Recogido', color: '#06B6D4', bgColor: '#ECFEFF' },
  on_the_way: { label: 'En camino', color: '#EC4899', bgColor: '#FDF2F8' },
  delivered: { label: 'Entregado', color: '#22C55E', bgColor: '#F0FDF4' },
  cancelled: { label: 'Cancelado', color: '#EF4444', bgColor: '#FEF2F2' },
};

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'active' | 'all'>('active');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getAllOrders({
        status: statusFilter === 'all' || statusFilter === 'active' ? undefined : statusFilter,
      });
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const renderOrder = ({ item: order }: { item: Order }) => {
    const statusConfig = STATUS_CONFIG[order.status];

    return (
      <TouchableOpacity style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="restaurant" size={16} color="#FF6B35" />
            <Text style={styles.detailText}>{order.restaurant.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={16} color="#3B82F6" />
            <Text style={styles.detailText}>{order.customer.name}</Text>
          </View>
          {order.driver && (
            <View style={styles.detailRow}>
              <Ionicons name="bicycle" size={16} color="#8B5CF6" />
              <Text style={styles.detailText}>{order.driver.name}</Text>
            </View>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
          <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const filters: { key: typeof statusFilter; label: string }[] = [
    { key: 'active', label: 'Activos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'delivered', label: 'Entregados' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Monitor de Pedidos</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'preparing').length}</Text>
          <Text style={styles.statLabel}>Preparando</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{orders.filter(o => o.status === 'on_the_way').length}</Text>
          <Text style={styles.statLabel}>En camino</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterBtn, statusFilter === filter.key && styles.filterBtnActive]}
            onPress={() => setStatusFilter(filter.key)}
          >
            <Text style={[styles.filterText, statusFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={64} color="#E5E5E5" />
            <Text style={styles.emptyText}>No hay pedidos</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    marginTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
  },
});
