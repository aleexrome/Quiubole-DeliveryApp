// ==========================================
// HOME DEL REPARTIDOR (ESTILO UBER)
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { driverApi, ordersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { DriverStatus, Order } from '../../types';

const { width } = Dimensions.get('window');

export default function DriverHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<DriverStatus>('offline');
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [earnings, setEarnings] = useState({ today: 0, pending: 0 });

  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkActiveDelivery();
    loadEarnings();
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let ordersInterval: NodeJS.Timeout | null = null;

    if (status === 'online') {
      // Start location tracking
      startLocationTracking().then(sub => {
        locationSubscription = sub;
      });

      // Poll for available orders
      ordersInterval = setInterval(loadAvailableOrders, 10000);
      loadAvailableOrders();

      // Start pulse animation
      startPulseAnimation();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (ordersInterval) {
        clearInterval(ordersInterval);
      }
    };
  }, [status]);

  const startLocationTracking = async () => {
    const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos tu ubicacion para mostrarte pedidos cercanos');
      return null;
    }

    return await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        setCurrentLocation(location);
        // Update location on server
        driverApi.updateLocation(location.coords.latitude, location.coords.longitude);
      }
    );
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const checkActiveDelivery = async () => {
    try {
      const order = await ordersApi.getActiveDelivery();
      if (order) {
        setActiveOrder(order);
        setStatus('busy');
      }
    } catch (error) {
      // No active delivery
    }
  };

  const loadAvailableOrders = async () => {
    if (!currentLocation) return;
    try {
      const orders = await ordersApi.getAvailableOrders(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        5 // 5km radius
      );
      setAvailableOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadEarnings = async () => {
    try {
      const data = await driverApi.getEarnings('day');
      setEarnings(data);
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const toggleStatus = async () => {
    const newStatus = status === 'offline' ? 'online' : 'offline';

    // Animate toggle
    Animated.spring(slideAnim, {
      toValue: newStatus === 'online' ? 1 : 0,
      useNativeDriver: true,
    }).start();

    try {
      await driverApi.updateStatus(newStatus);
      setStatus(newStatus);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado');
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    try {
      await ordersApi.acceptDelivery(order.id);
      setActiveOrder(order);
      setStatus('busy');
      navigation.navigate('ActiveDelivery', { orderId: order.id });
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar el pedido. Puede que otro repartidor ya lo tomó.');
      loadAvailableOrders();
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatDistance = (km: number) => km < 1 ? `${(km * 1000).toFixed(0)}m` : `${km.toFixed(1)}km`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}</Text>
          <Text style={styles.statusText}>
            {status === 'offline' ? 'Desconectado' : status === 'online' ? 'Buscando pedidos...' : 'En entrega'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.earningsBtn}
          onPress={() => navigation.navigate('Earnings')}
        >
          <Ionicons name="wallet-outline" size={20} color="#22C55E" />
          <Text style={styles.earningsText}>{formatCurrency(earnings.today)}</Text>
        </TouchableOpacity>
      </View>

      {/* Map placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={64} color="#E5E5E5" />
          <Text style={styles.mapPlaceholderText}>
            {currentLocation ? 'Mapa de tu ubicacion' : 'Obteniendo ubicacion...'}
          </Text>
        </View>

        {/* Status indicator */}
        {status === 'online' && (
          <Animated.View
            style={[
              styles.statusIndicator,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <View style={styles.statusDot} />
          </Animated.View>
        )}
      </View>

      {/* Active Order Banner */}
      {activeOrder && (
        <TouchableOpacity
          style={styles.activeOrderBanner}
          onPress={() => navigation.navigate('ActiveDelivery', { orderId: activeOrder.id })}
        >
          <View style={styles.activeOrderInfo}>
            <Ionicons name="bicycle" size={24} color="#fff" />
            <View style={styles.activeOrderText}>
              <Text style={styles.activeOrderTitle}>Entrega en progreso</Text>
              <Text style={styles.activeOrderSubtitle}>#{activeOrder.orderNumber}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Available Orders */}
      {status === 'online' && availableOrders.length > 0 && (
        <View style={styles.ordersContainer}>
          <Text style={styles.ordersTitle}>Pedidos Disponibles</Text>
          {availableOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View style={styles.restaurantInfo}>
                  <Ionicons name="restaurant" size={20} color="#FF6B35" />
                  <Text style={styles.restaurantName}>{order.restaurant.name}</Text>
                </View>
                <Text style={styles.orderEarning}>{formatCurrency(order.deliveryFee + (order.tip || 0))}</Text>
              </View>
              <View style={styles.orderDetails}>
                <View style={styles.orderDetail}>
                  <Ionicons name="location" size={16} color="#666" />
                  <Text style={styles.orderDetailText}>
                    {/* formatDistance(order.distance) */} 2.5km
                  </Text>
                </View>
                <View style={styles.orderDetail}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.orderDetailText}>~15 min</Text>
                </View>
                <View style={styles.orderDetail}>
                  <Ionicons name="bag" size={16} color="#666" />
                  <Text style={styles.orderDetailText}>{order.items.length} productos</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAcceptOrder(order)}
              >
                <Text style={styles.acceptBtnText}>Aceptar Pedido</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Empty state */}
      {status === 'online' && availableOrders.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color="#E5E5E5" />
          <Text style={styles.emptyText}>Buscando pedidos cercanos...</Text>
          <Text style={styles.emptySubtext}>Te notificaremos cuando haya uno disponible</Text>
        </View>
      )}

      {/* Bottom Toggle */}
      <View style={styles.bottomContainer}>
        {status !== 'busy' && (
          <TouchableOpacity
            style={[styles.toggleButton, status === 'online' && styles.toggleButtonActive]}
            onPress={toggleStatus}
          >
            <Animated.View
              style={[
                styles.toggleSlider,
                {
                  transform: [{
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [4, width - 88],
                    })
                  }]
                }
              ]}
            />
            <Text style={[styles.toggleText, status === 'online' && styles.toggleTextActive]}>
              {status === 'offline' ? 'Desliza para Conectarte' : 'Conectado'}
            </Text>
            <Ionicons
              name={status === 'offline' ? 'power' : 'checkmark-circle'}
              size={24}
              color={status === 'offline' ? '#666' : '#fff'}
              style={styles.toggleIcon}
            />
          </TouchableOpacity>
        )}
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  earningsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  earningsText: {
    color: '#22C55E',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholderText: {
    color: '#666',
    marginTop: 8,
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  activeOrderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FF6B35',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  activeOrderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeOrderText: {
    marginLeft: 12,
  },
  activeOrderTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeOrderSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  ordersContainer: {
    padding: 16,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
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
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginLeft: 8,
  },
  orderEarning: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  orderDetails: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  acceptBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
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
  bottomContainer: {
    padding: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E5E5',
    height: 56,
    borderRadius: 28,
    position: 'relative',
    overflow: 'hidden',
  },
  toggleButtonActive: {
    backgroundColor: '#22C55E',
  },
  toggleSlider: {
    position: 'absolute',
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  toggleIcon: {
    position: 'absolute',
    right: 16,
  },
});
