// ==========================================
// HISTORIAL DE ENTREGAS DEL REPARTIDOR
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
import { driverApi } from '../../services/api';

interface Delivery {
  id: string;
  orderNumber: string;
  restaurantName: string;
  customerName: string;
  customerAddress: string;
  earnings: number;
  tip: number;
  distance: number;
  duration: number; // minutos
  completedAt: Date;
  rating?: number;
}

export default function DriverDeliveriesScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    avgRating: 0,
    avgTime: 0,
    totalDistance: 0,
  });

  useEffect(() => {
    loadDeliveries();
    loadStats();
  }, []);

  const loadDeliveries = async (pageNum: number = 1) => {
    try {
      const data = await driverApi.getDeliveryHistory(pageNum);
      if (pageNum === 1) {
        setDeliveries(data);
      } else {
        setDeliveries([...deliveries, ...data]);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await driverApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeliveries(1);
    await loadStats();
    setRefreshing(false);
    setPage(1);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadDeliveries(nextPage);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Hoy ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Ayer ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderDelivery = ({ item }: { item: Delivery }) => (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
          <Text style={styles.deliveryDate}>{formatDate(item.completedAt)}</Text>
        </View>
        <View style={styles.earningsContainer}>
          <Text style={styles.earnings}>{formatCurrency(item.earnings + item.tip)}</Text>
          {item.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={12} color="#EAB308" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.routeContainer}>
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#FF6B35' }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Recoger</Text>
            <Text style={styles.routeName}>{item.restaurantName}</Text>
          </View>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.routeDot, { backgroundColor: '#22C55E' }]} />
          <View style={styles.routeInfo}>
            <Text style={styles.routeLabel}>Entregar</Text>
            <Text style={styles.routeName}>{item.customerName}</Text>
          </View>
        </View>
      </View>

      <View style={styles.deliveryStats}>
        <View style={styles.deliveryStat}>
          <Ionicons name="navigate" size={16} color="#666" />
          <Text style={styles.deliveryStatText}>{item.distance.toFixed(1)} km</Text>
        </View>
        <View style={styles.deliveryStat}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.deliveryStatText}>{item.duration} min</Text>
        </View>
        {item.tip > 0 && (
          <View style={styles.deliveryStat}>
            <Ionicons name="heart" size={16} color="#22C55E" />
            <Text style={[styles.deliveryStatText, { color: '#22C55E' }]}>
              +{formatCurrency(item.tip)} propina
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mis Entregas</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
          <Text style={styles.statLabel}>Entregas</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statWithIcon}>
            <Ionicons name="star" size={16} color="#EAB308" />
            <Text style={styles.statValue}>{stats.avgRating.toFixed(1)}</Text>
          </View>
          <Text style={styles.statLabel}>Calificacion</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.avgTime}</Text>
          <Text style={styles.statLabel}>Min prom.</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalDistance.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Km totales</Text>
        </View>
      </View>

      {/* Deliveries List */}
      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="bicycle-outline" size={64} color="#E5E5E5" />
            <Text style={styles.emptyText}>No hay entregas todavia</Text>
            <Text style={styles.emptySubtext}>
              Tus entregas completadas apareceran aqui
            </Text>
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  deliveryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderInfo: {},
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  deliveryDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earnings: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 4,
  },
  routeContainer: {
    marginTop: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeInfo: {
    marginLeft: 12,
  },
  routeLabel: {
    fontSize: 10,
    color: '#666',
  },
  routeName: {
    fontSize: 14,
    color: '#0F172A',
  },
  routeLine: {
    width: 2,
    height: 16,
    backgroundColor: '#E5E5E5',
    marginLeft: 4,
    marginVertical: 4,
  },
  deliveryStats: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    gap: 16,
  },
  deliveryStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliveryStatText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});
