// ==========================================
// ORDER TRACKING SCREEN - Rastreo en tiempo real
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import locationService, { Coordinates } from '../../services/location';

// Colores de Quiubole
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  success: '#4CAF50',
  warning: '#FFC107',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  textLight: '#6C757D',
};

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

interface OrderTrackingScreenProps {
  navigation: any;
  route: {
    params: {
      orderId: string;
    };
  };
}

interface OrderStatus {
  status: string;
  statusText: string;
  estimatedTime: string;
  progress: number;
}

const ORDER_STATUSES: Record<string, OrderStatus> = {
  pending: {
    status: 'pending',
    statusText: 'Pedido recibido',
    estimatedTime: 'Esperando confirmación',
    progress: 0.1,
  },
  accepted: {
    status: 'accepted',
    statusText: 'Preparando tu pedido',
    estimatedTime: '15-20 min',
    progress: 0.25,
  },
  preparing: {
    status: 'preparing',
    statusText: 'Cocinando tu pedido',
    estimatedTime: '10-15 min',
    progress: 0.4,
  },
  ready: {
    status: 'ready',
    statusText: 'Pedido listo',
    estimatedTime: 'Esperando repartidor',
    progress: 0.55,
  },
  picked_up: {
    status: 'picked_up',
    statusText: 'En camino',
    estimatedTime: '10-15 min',
    progress: 0.75,
  },
  nearby: {
    status: 'nearby',
    statusText: 'Repartidor cerca',
    estimatedTime: '2-5 min',
    progress: 0.9,
  },
  delivered: {
    status: 'delivered',
    statusText: '¡Entregado!',
    estimatedTime: 'Completado',
    progress: 1,
  },
};

export default function OrderTrackingScreen({ navigation, route }: OrderTrackingScreenProps) {
  const { orderId } = route.params;
  const mapRef = useRef<MapView>(null);

  const [loading, setLoading] = useState(true);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>(ORDER_STATUSES.pending);
  const [driverLocation, setDriverLocation] = useState<Coordinates | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<Coordinates>({
    lat: 19.4326,
    lng: -99.1332,
  });
  const [restaurantLocation, setRestaurantLocation] = useState<Coordinates>({
    lat: 19.4350,
    lng: -99.1380,
  });
  const [driver, setDriver] = useState({
    name: 'Carlos López',
    photo: null,
    phone: '55 1234 5678',
    rating: 4.8,
    vehicle: 'Moto Honda',
    plate: 'ABC-123',
  });
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [eta, setEta] = useState('15 min');

  useEffect(() => {
    loadOrderData();
    startDriverTracking();

    return () => {
      // Cleanup
    };
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      // TODO: Cargar datos del pedido desde la API
      // const order = await api.orders.getById(orderId);

      // Datos de ejemplo
      setRestaurantLocation({ lat: 19.4350, lng: -99.1380 });
      setDeliveryLocation({ lat: 19.4300, lng: -99.1300 });
      setOrderStatus(ORDER_STATUSES.picked_up);

      // Simular ubicación del repartidor
      setDriverLocation({ lat: 19.4330, lng: -99.1350 });

      // Generar ruta simulada
      generateRoute();
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDriverTracking = () => {
    // Simular movimiento del repartidor
    const interval = setInterval(() => {
      setDriverLocation((prev) => {
        if (!prev) return null;

        // Mover hacia el destino
        const newLat = prev.lat - 0.0002 + Math.random() * 0.0001;
        const newLng = prev.lng + 0.0002 + Math.random() * 0.0001;

        // Calcular ETA
        const distance = locationService.formatDistance(
          Math.sqrt(
            Math.pow((deliveryLocation.lat - newLat) * 111000, 2) +
              Math.pow((deliveryLocation.lng - newLng) * 111000 * Math.cos(newLat * Math.PI / 180), 2)
          )
        );

        return { lat: newLat, lng: newLng };
      });
    }, 3000);

    return () => clearInterval(interval);
  };

  const generateRoute = () => {
    // Generar puntos intermedios para la ruta
    const points: Coordinates[] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({
        lat: restaurantLocation.lat + (deliveryLocation.lat - restaurantLocation.lat) * t,
        lng: restaurantLocation.lng + (deliveryLocation.lng - restaurantLocation.lng) * t,
      });
    }

    setRouteCoordinates(points);
  };

  const centerOnDriver = () => {
    if (driverLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: driverLocation.lat,
        longitude: driverLocation.lng,
        latitudeDelta: LATITUDE_DELTA / 2,
        longitudeDelta: LONGITUDE_DELTA / 2,
      });
    }
  };

  const fitAllMarkers = () => {
    if (mapRef.current) {
      const coordinates = [
        { latitude: deliveryLocation.lat, longitude: deliveryLocation.lng },
        { latitude: restaurantLocation.lat, longitude: restaurantLocation.lng },
      ];

      if (driverLocation) {
        coordinates.push({ latitude: driverLocation.lat, longitude: driverLocation.lng });
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  const callDriver = () => {
    const phoneUrl = Platform.OS === 'ios'
      ? `telprompt:${driver.phone}`
      : `tel:${driver.phone}`;
    Linking.openURL(phoneUrl);
  };

  const messageDriver = () => {
    // TODO: Abrir chat con el repartidor
    navigation.navigate('Chat', { driverId: 'driver_id', orderId });
  };

  useEffect(() => {
    if (!loading) {
      setTimeout(fitAllMarkers, 500);
    }
  }, [loading, driverLocation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: deliveryLocation.lat,
          longitude: deliveryLocation.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Marker del restaurante */}
        <Marker
          coordinate={{
            latitude: restaurantLocation.lat,
            longitude: restaurantLocation.lng,
          }}
          title="Restaurante"
        >
          <View style={styles.restaurantMarker}>
            <Ionicons name="restaurant" size={20} color={COLORS.white} />
          </View>
        </Marker>

        {/* Marker de entrega */}
        <Marker
          coordinate={{
            latitude: deliveryLocation.lat,
            longitude: deliveryLocation.lng,
          }}
          title="Tu ubicación"
        >
          <View style={styles.deliveryMarker}>
            <Ionicons name="home" size={20} color={COLORS.white} />
          </View>
        </Marker>

        {/* Marker del repartidor */}
        {driverLocation && orderStatus.progress >= 0.55 && (
          <Marker
            coordinate={{
              latitude: driverLocation.lat,
              longitude: driverLocation.lng,
            }}
            title={driver.name}
          >
            <View style={styles.driverMarker}>
              <Ionicons name="bicycle" size={24} color={COLORS.white} />
            </View>
          </Marker>
        )}

        {/* Línea de ruta */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates.map((c) => ({
              latitude: c.lat,
              longitude: c.lng,
            }))}
            strokeWidth={4}
            strokeColor={COLORS.primary}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Botones del mapa */}
      <View style={styles.mapButtons}>
        <TouchableOpacity style={styles.mapButton} onPress={fitAllMarkers}>
          <Ionicons name="expand" size={20} color={COLORS.secondary} />
        </TouchableOpacity>
        {driverLocation && (
          <TouchableOpacity style={styles.mapButton} onPress={centerOnDriver}>
            <Ionicons name="locate" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Panel de información */}
      <View style={styles.infoPanel}>
        {/* Estado del pedido */}
        <View style={styles.statusContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${orderStatus.progress * 100}%` }]}
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>{orderStatus.statusText}</Text>
            <Text style={styles.etaText}>{eta}</Text>
          </View>
        </View>

        {/* Información del repartidor */}
        {orderStatus.progress >= 0.55 && (
          <View style={styles.driverContainer}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                {driver.photo ? (
                  <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
                ) : (
                  <Ionicons name="person" size={30} color={COLORS.gray} />
                )}
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.driverRating}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.driverRatingText}>{driver.rating}</Text>
                </View>
                <Text style={styles.driverVehicle}>
                  {driver.vehicle} • {driver.plate}
                </Text>
              </View>
            </View>

            <View style={styles.driverActions}>
              <TouchableOpacity style={styles.actionButton} onPress={callDriver}>
                <Ionicons name="call" size={24} color={COLORS.success} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={messageDriver}>
                <Ionicons name="chatbubble" size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Botón de ayuda */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => navigation.navigate('OrderHelp', { orderId })}
        >
          <Ionicons name="help-circle-outline" size={20} color={COLORS.textLight} />
          <Text style={styles.helpButtonText}>¿Necesitas ayuda con tu pedido?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  map: {
    flex: 1,
  },
  mapButtons: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8,
  },
  mapButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  restaurantMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  deliveryMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  statusContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.lightGray,
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  etaText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
    marginBottom: 16,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  driverRatingText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 4,
  },
  driverVehicle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  driverActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  helpButtonText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginLeft: 8,
  },
});
