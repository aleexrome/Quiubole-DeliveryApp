// ==========================================
// PANTALLA DE PEDIDOS DEL RESTAURANTE
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ordersApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Nuevos' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'ready_for_pickup', label: 'Listos' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Nuevo', color: '#FF6B35', bgColor: '#FFF5F0' },
  confirmed: { label: 'Confirmado', color: '#3B82F6', bgColor: '#EFF6FF' },
  preparing: { label: 'Preparando', color: '#EAB308', bgColor: '#FEFCE8' },
  ready_for_pickup: { label: 'Listo', color: '#22C55E', bgColor: '#F0FDF4' },
  driver_assigned: { label: 'Repartidor en camino', color: '#8B5CF6', bgColor: '#F5F3FF' },
  picked_up: { label: 'Recogido', color: '#06B6D4', bgColor: '#ECFEFF' },
  on_the_way: { label: 'En camino', color: '#EC4899', bgColor: '#FDF2F8' },
  delivered: { label: 'Entregado', color: '#22C55E', bgColor: '#F0FDF4' },
  cancelled: { label: 'Cancelado', color: '#EF4444', bgColor: '#FEF2F2' },
};

export default function RestaurantOrdersScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await ordersApi.getRestaurantOrders(status);
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

  const handleAcceptOrder = async (order: Order) => {
    Alert.prompt(
      'Tiempo de Preparacion',
      '¿Cuantos minutos tardara el pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async (minutes) => {
            try {
              await ordersApi.acceptOrder(order.id, parseInt(minutes || '30'));
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'No se pudo aceptar el pedido');
            }
          },
        },
      ],
      'plain-text',
      '30'
    );
  };

  const handleRejectOrder = async (order: Order) => {
    Alert.alert(
      'Rechazar Pedido',
      '¿Estas seguro? Esta accion no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersApi.rejectOrder(order.id, 'Restaurante no disponible');
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar el pedido');
            }
          },
        },
      ]
    );
  };

  const handleMarkReady = async (order: Order) => {
    try {
      await ordersApi.markReady(order.id);
      loadOrders();
      Alert.alert('Listo', 'El pedido esta listo para recoger');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el pedido');
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  const renderOrder = ({ item: order }: { item: Order }) => {
    const statusConfig = STATUS_CONFIG[order.status];

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerInfo}>
          <Ionicons name="person-outline" size={16} color="#666" />
          <Text style={styles.customerName}>{order.customer.name}</Text>
        </View>

        {/* Items */}
        <View style={styles.itemsList}>
          {order.items.slice(0, 3).map((item, index) => (
            <Text key={index} style={styles.itemText}>
              {item.quantity}x {item.product.name}
            </Text>
          ))}
          {order.items.length > 3 && (
            <Text style={styles.moreItems}>
              +{order.items.length - 3} productos mas
            </Text>
          )}
        </View>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <View style={styles.instructions}>
            <Ionicons name="chatbubble-outline" size={14} color="#FF6B35" />
            <Text style={styles.instructionsText} numberOfLines={2}>
              {order.specialInstructions}
            </Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
        </View>

        {/* Actions based on status */}
        {order.status === 'pending' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleRejectOrder(order)}
            >
              <Ionicons name="close" size={18} color="#EF4444" />
              <Text style={styles.rejectBtnText}>Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAcceptOrder(order)}
            >
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.acceptBtnText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === 'preparing' && (
          <TouchableOpacity
            style={styles.readyBtn}
            onPress={() => handleMarkReady(order)}
          >
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.readyBtnText}>Marcar como Listo</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Pedidos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
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
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  tabActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  tabTextActive: {
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
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  orderTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  itemsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  itemText: {
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 4,
  },
  moreItems: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F0',
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    gap: 6,
  },
  rejectBtnText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    gap: 6,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  readyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    marginTop: 16,
    gap: 6,
  },
  readyBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
    fontSize: 16,
  },
});
