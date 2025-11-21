// ==========================================
// DASHBOARD DEL ADMINISTRADOR
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { adminApi } from '../../services/api';

interface DashboardStats {
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  revenueToday: number;
  activeUsers: number;
  activeDrivers: number;
  activeRestaurants: number;
  pendingRestaurants: number;
  pendingDrivers: number;
  pendingProducts: number;
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    ordersToday: 0,
    totalRevenue: 0,
    revenueToday: 0,
    activeUsers: 0,
    activeDrivers: 0,
    activeRestaurants: 0,
    pendingRestaurants: 0,
    pendingDrivers: 0,
    pendingProducts: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const pendingTotal = stats.pendingRestaurants + stats.pendingDrivers + stats.pendingProducts;

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
            <Text style={styles.title}>Panel de Admin</Text>
            <Text style={styles.subtitle}>Quiubole!</Text>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color="#0F172A" />
            {pendingTotal > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingTotal}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Pending Approvals Alert */}
        {pendingTotal > 0 && (
          <View style={styles.alertCard}>
            <Ionicons name="alert-circle" size={24} color="#EAB308" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{pendingTotal} aprobaciones pendientes</Text>
              <Text style={styles.alertText}>
                {stats.pendingRestaurants} negocios, {stats.pendingDrivers} repartidores, {stats.pendingProducts} productos
              </Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chevron-forward" size={24} color="#EAB308" />
            </TouchableOpacity>
          </View>
        )}

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.mainStatCard}>
            <Ionicons name="receipt" size={32} color="#FF6B35" />
            <Text style={styles.mainStatValue}>{stats.ordersToday}</Text>
            <Text style={styles.mainStatLabel}>Pedidos Hoy</Text>
            <Text style={styles.mainStatTotal}>Total: {stats.totalOrders}</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Ionicons name="cash" size={32} color="#22C55E" />
            <Text style={styles.mainStatValue}>{formatCurrency(stats.revenueToday)}</Text>
            <Text style={styles.mainStatLabel}>Ingresos Hoy</Text>
            <Text style={styles.mainStatTotal}>Total: {formatCurrency(stats.totalRevenue)}</Text>
          </View>
        </View>

        {/* Secondary Stats */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Users')}
          >
            <Ionicons name="people" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Usuarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Restaurants')}
          >
            <Ionicons name="restaurant" size={24} color="#EC4899" />
            <Text style={styles.statValue}>{stats.activeRestaurants}</Text>
            <Text style={styles.statLabel}>Negocios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('AdminDrivers')}
          >
            <Ionicons name="bicycle" size={24} color="#8B5CF6" />
            <Text style={styles.statValue}>{stats.activeDrivers}</Text>
            <Text style={styles.statLabel}>Repartidores</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('AdminProducts')}
          >
            <Ionicons name="fast-food" size={24} color="#F59E0B" />
            <Text style={styles.statValue}>{stats.pendingProducts}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rapidas</Text>

          {/* Pending Approvals */}
          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="restaurant" size={24} color="#D97706" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Negocios por aprobar</Text>
              <Text style={styles.actionSubtitle}>{stats.pendingRestaurants} pendientes</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{stats.pendingRestaurants}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={[styles.actionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="bicycle" size={24} color="#7C3AED" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Repartidores por aprobar</Text>
              <Text style={styles.actionSubtitle}>{stats.pendingDrivers} pendientes</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{stats.pendingDrivers}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('AdminProducts')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF5F0' }]}>
              <Ionicons name="fast-food" size={24} color="#FF6B35" />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Productos por aprobar</Text>
              <Text style={styles.actionSubtitle}>{stats.pendingProducts} pendientes</Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{stats.pendingProducts}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion</Text>
          <View style={styles.managementGrid}>
            <TouchableOpacity style={styles.managementCard}>
              <Ionicons name="pricetag" size={28} color="#FF6B35" />
              <Text style={styles.managementText}>Cupones</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.managementCard}>
              <Ionicons name="map" size={28} color="#FF6B35" />
              <Text style={styles.managementText}>Zonas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.managementCard}>
              <Ionicons name="analytics" size={28} color="#FF6B35" />
              <Text style={styles.managementText}>Reportes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.managementCard}>
              <Ionicons name="settings" size={28} color="#FF6B35" />
              <Text style={styles.managementText}>Config</Text>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  notificationBtn: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
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
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
  alertText: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  mainStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 12,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  mainStatTotal: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  managementGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  managementCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  managementText: {
    fontSize: 12,
    color: '#0F172A',
    marginTop: 8,
  },
});
