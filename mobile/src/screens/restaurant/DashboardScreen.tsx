// ==========================================
// DASHBOARD DEL RESTAURANTE
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { restaurantsApi, ordersApi } from '../../services/api';
import { Order, Restaurant } from '../../types';

export default function RestaurantDashboardScreen() {
  const navigation = useNavigation<any>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todaySales: 0,
    pendingOrders: 0,
    preparingOrders: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [restaurantData, ordersData, statsData] = await Promise.all([
        restaurantsApi.getMyRestaurant(),
        ordersApi.getRestaurantOrders('pending'),
        restaurantsApi.getStats('day'),
      ]);
      setRestaurant(restaurantData);
      setIsActive(restaurantData.isActive);
      setPendingOrders(ordersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleActive = async () => {
    try {
      await restaurantsApi.updateAvailability(!isActive);
      setIsActive(!isActive);
    } catch (error) {
      console.error('Error toggling availability:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.restaurantName}>{restaurant?.name || 'Mi Negocio'}</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
            {pendingOrders.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingOrders.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Status Toggle */}
        <View style={styles.statusCard}>
          <View style={styles.statusLeft}>
            <View style={[styles.statusDot, isActive && styles.statusDotActive]} />
            <View>
              <Text style={styles.statusTitle}>
                {isActive ? 'Recibiendo Pedidos' : 'Negocio Cerrado'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isActive ? 'Los clientes pueden ordenar' : 'No recibiras pedidos'}
              </Text>
            </View>
          </View>
          <Switch
            value={isActive}
            onValueChange={toggleActive}
            trackColor={{ false: '#E5E5E5', true: '#FF6B35' }}
            thumbColor="#fff"
          />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="receipt" size={24} color="#FF6B35" />
            <Text style={styles.statValue}>{stats.todayOrders}</Text>
            <Text style={styles.statLabel}>Pedidos Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color="#22C55E" />
            <Text style={styles.statValue}>{formatCurrency(stats.todaySales)}</Text>
            <Text style={styles.statLabel}>Ventas Hoy</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color="#EAB308" />
            <Text style={styles.statValue}>{stats.pendingOrders}</Text>
            <Text style={styles.statLabel}>Por Confirmar</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#EC4899" />
            <Text style={styles.statValue}>{stats.preparingOrders}</Text>
            <Text style={styles.statLabel}>Preparando</Text>
          </View>
        </View>

        {/* Pending Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pedidos Pendientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.seeAll}>Ver todos</Text>
            </TouchableOpacity>
          </View>

          {pendingOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
              <Text style={styles.emptyText}>No hay pedidos pendientes</Text>
            </View>
          ) : (
            pendingOrders.slice(0, 3).map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderBadgeText}>NUEVO</Text>
                  </View>
                </View>
                <Text style={styles.orderCustomer}>{order.customer.name}</Text>
                <Text style={styles.orderItems}>
                  {order.items.length} productos - {formatCurrency(order.total)}
                </Text>
                <View style={styles.orderActions}>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => {/* Rechazar */}}
                  >
                    <Text style={styles.rejectBtnText}>Rechazar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => {/* Aceptar */}}
                  >
                    <Text style={styles.acceptBtnText}>Aceptar</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rapidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Menu')}
            >
              <Ionicons name="restaurant" size={28} color="#FF6B35" />
              <Text style={styles.actionText}>Gestionar Menu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Stats')}
            >
              <Ionicons name="stats-chart" size={28} color="#FF6B35" />
              <Text style={styles.actionText}>Ver Estadisticas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="settings" size={28} color="#FF6B35" />
              <Text style={styles.actionText}>Configuracion</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  greeting: {
    fontSize: 14,
    color: '#666',
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  notificationBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E5E5E5',
    marginRight: 12,
  },
  statusDotActive: {
    backgroundColor: '#22C55E',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  seeAll: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
    fontSize: 14,
  },
  orderCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  orderBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  orderBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  orderItems: {
    fontSize: 14,
    color: '#0F172A',
    marginTop: 4,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  rejectBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  rejectBtnText: {
    color: '#666',
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#0F172A',
    marginTop: 8,
    textAlign: 'center',
  },
});
