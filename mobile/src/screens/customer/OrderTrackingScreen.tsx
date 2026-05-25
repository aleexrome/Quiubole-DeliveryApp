// ==========================================
// DEVOLÓN — Order Tracking
//
// Mapa fullscreen edge-to-edge con markers dark-themed (restaurante negro,
// destino verde-success, repartidor amarillo glow). Header transparente
// flotante con back. Bottom sheet glass con progress bar amarilla + ETA
// hero number, driver card con avatar + actions (call/chat). Map controls
// flotantes derecha como halos glass.
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
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import locationService, { Coordinates } from '../../services/location';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

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

// Dark map style — Tesla / Linear vibe
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0A0A0A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8C8C8C' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0A0A0A' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A1A1A' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#050505' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

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
    lat: 19.435,
    lng: -99.138,
  });
  const [driver] = useState({
    name: 'Carlos López',
    photo: null as string | null,
    phone: '55 1234 5678',
    rating: 4.8,
    vehicle: 'Moto Honda',
    plate: 'ABC-123',
  });
  const [routeCoordinates, setRouteCoordinates] = useState<Coordinates[]>([]);
  const [eta] = useState('15 min');

  useEffect(() => {
    loadOrderData();
    const cleanup = startDriverTracking();
    return cleanup;
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      setRestaurantLocation({ lat: 19.435, lng: -99.138 });
      setDeliveryLocation({ lat: 19.43, lng: -99.13 });
      setOrderStatus(ORDER_STATUSES.picked_up);
      setDriverLocation({ lat: 19.433, lng: -99.135 });
      generateRoute();
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const startDriverTracking = () => {
    const interval = setInterval(() => {
      setDriverLocation((prev) => {
        if (!prev) return null;
        const newLat = prev.lat - 0.0002 + Math.random() * 0.0001;
        const newLng = prev.lng + 0.0002 + Math.random() * 0.0001;
        locationService.formatDistance(
          Math.sqrt(
            Math.pow((deliveryLocation.lat - newLat) * 111000, 2) +
              Math.pow(
                (deliveryLocation.lng - newLng) *
                  111000 *
                  Math.cos((newLat * Math.PI) / 180),
                2,
              ),
          ),
        );
        return { lat: newLat, lng: newLng };
      });
    }, 3000);
    return () => clearInterval(interval);
  };

  const generateRoute = () => {
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
        coordinates.push({
          latitude: driverLocation.lat,
          longitude: driverLocation.lng,
        });
      }
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 140, right: 60, bottom: 360, left: 60 },
        animated: true,
      });
    }
  };

  const callDriver = () => {
    const phoneUrl =
      Platform.OS === 'ios' ? `telprompt:${driver.phone}` : `tel:${driver.phone}`;
    Linking.openURL(phoneUrl);
  };

  const messageDriver = async () => {
    try {
      const { messagesApi } = await import('../../services/api');
      const participants = await messagesApi.getParticipants(orderId);
      const target = participants.find((p: any) => p.role === 'driver');
      if (!target) {
        const { Alert } = await import('react-native');
        Alert.alert(
          'Aún sin repartidor',
          'Tu pedido todavía no tiene un repartidor asignado. Inténtalo cuando aparezca el rider en pantalla.',
        );
        return;
      }
      navigation.navigate('Chat', {
        orderId,
        otherUserId: target.userId,
        otherUserName: driver.name,
        otherUserRole: 'driver',
      });
    } catch (error: any) {
      const { Alert } = await import('react-native');
      Alert.alert(
        'No se pudo abrir el chat',
        error?.response?.data?.message || 'Intenta de nuevo.',
      );
    }
  };

  const messageRestaurant = async () => {
    try {
      const { messagesApi } = await import('../../services/api');
      const participants = await messagesApi.getParticipants(orderId);
      const target = participants.find((p: any) => p.role === 'restaurant');
      if (!target) {
        const { Alert } = await import('react-native');
        Alert.alert(
          'Restaurante no disponible',
          'No se puede chatear con el restaurante en este momento.',
        );
        return;
      }
      navigation.navigate('Chat', {
        orderId,
        otherUserId: target.userId,
        otherUserName: 'Restaurante',
        otherUserRole: 'restaurant',
      });
    } catch (error: any) {
      const { Alert } = await import('react-native');
      Alert.alert(
        'No se pudo abrir el chat',
        error?.response?.data?.message || 'Intenta de nuevo.',
      );
    }
  };

  useEffect(() => {
    if (!loading) {
      setTimeout(fitAllMarkers, 500);
    }
  }, [loading, driverLocation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Conectando con el repartidor…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ============ Map ============ */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          latitude: deliveryLocation.lat,
          longitude: deliveryLocation.lng,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={{
            latitude: restaurantLocation.lat,
            longitude: restaurantLocation.lng,
          }}
          title="Restaurante"
        >
          <View style={styles.restaurantMarker}>
            <Ionicons name="restaurant" size={18} color={colors.text} />
          </View>
        </Marker>

        <Marker
          coordinate={{
            latitude: deliveryLocation.lat,
            longitude: deliveryLocation.lng,
          }}
          title="Tu ubicación"
        >
          <View style={styles.deliveryMarker}>
            <Ionicons name="home" size={18} color={colors.text} />
          </View>
        </Marker>

        {driverLocation && orderStatus.progress >= 0.55 && (
          <Marker
            coordinate={{
              latitude: driverLocation.lat,
              longitude: driverLocation.lng,
            }}
            title={driver.name}
          >
            <View style={styles.driverMarker}>
              <Ionicons name="bicycle" size={22} color={colors.onPrimary} />
            </View>
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates.map((c) => ({
              latitude: c.lat,
              longitude: c.lng,
            }))}
            strokeWidth={4}
            strokeColor={colors.primary}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* ============ Floating Header ============ */}
      <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.topIconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topEyebrow}>EN VIVO</Text>
          <Text style={styles.topTitle}>Tu pedido</Text>
        </View>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* ============ Map Controls ============ */}
      <View style={styles.mapButtons}>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={fitAllMarkers}
          activeOpacity={0.85}
        >
          <Ionicons name="expand" size={18} color={colors.text} />
        </TouchableOpacity>
        {driverLocation && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={centerOnDriver}
            activeOpacity={0.85}
          >
            <Ionicons name="locate" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ============ Info Panel ============ */}
      <SafeAreaView edges={['bottom']} style={styles.infoPanel}>
        {/* Status header */}
        <View style={styles.statusHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusEyebrow}>ESTADO ACTUAL</Text>
            <Text style={styles.statusText}>{orderStatus.statusText}</Text>
          </View>
          <View style={styles.etaBlock}>
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaText}>{eta}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${orderStatus.progress * 100}%` }]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Pedido</Text>
          <Text style={styles.progressLabel}>Preparando</Text>
          <Text style={styles.progressLabel}>En camino</Text>
          <Text style={styles.progressLabel}>Entregado</Text>
        </View>

        {/* Driver */}
        {orderStatus.progress >= 0.55 && (
          <View style={styles.driverContainer}>
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                {driver.photo ? (
                  <Image source={{ uri: driver.photo }} style={styles.driverPhoto} />
                ) : (
                  <Ionicons name="person" size={24} color={colors.textMuted} />
                )}
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driver.name}</Text>
                <View style={styles.driverMeta}>
                  <Ionicons name="star" size={11} color={colors.primary} />
                  <Text style={styles.driverRatingText}>{driver.rating}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.driverVehicle}>
                    {driver.vehicle} · {driver.plate}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.driverActions}>
              <TouchableOpacity
                style={[styles.actionIconBtn, styles.actionCall]}
                onPress={callDriver}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={18} color={colors.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionIconBtn, styles.actionChat]}
                onPress={messageDriver}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Chat con restaurante */}
        <TouchableOpacity
          style={styles.helpRow}
          onPress={messageRestaurant}
          activeOpacity={0.85}
        >
          <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
          <Text style={styles.helpText}>Mensaje al restaurante</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Help */}
        <TouchableOpacity
          style={styles.helpRow}
          onPress={() => navigation.navigate('OrderHelp', { orderId })}
          activeOpacity={0.85}
        >
          <Ionicons name="help-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.helpText}>¿Necesitas ayuda con tu pedido?</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    marginTop: s.md,
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  map: { flex: 1 },

  // ============ TOP BAR ============
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.md,
    paddingTop: s.xs,
  },
  topIconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCenter: { flex: 1, alignItems: 'center' },
  topEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  topTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // ============ MAP CONTROLS ============
  mapButtons: {
    position: 'absolute',
    top: 110,
    right: s.md,
    gap: s.xs,
  },
  mapButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(10,10,10,0.85)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ============ MARKERS ============
  restaurantMarker: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },
  deliveryMarker: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.text,
  },
  driverMarker: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
    ...shadows.glow,
  },

  // ============ INFO PANEL ============
  infoPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bgRaised,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    paddingHorizontal: s.xl,
    paddingTop: s.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  statusText: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  etaBlock: { alignItems: 'flex-end' },
  etaLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  etaText: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 2,
  },

  // ============ PROGRESS ============
  progressBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: s.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: s.xs,
  },
  progressLabel: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ============ DRIVER ============
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s.lg,
    paddingTop: s.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    flex: 1,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverPhoto: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
  },
  driverDetails: { flex: 1 },
  driverName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  driverRatingText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.textFaint,
    marginHorizontal: 4,
  },
  driverVehicle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  driverActions: {
    flexDirection: 'row',
    gap: s.xs,
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCall: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderColor: 'rgba(31,174,111,0.35)',
  },
  actionChat: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.35)',
  },

  // ============ HELP ============
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    justifyContent: 'center',
    paddingVertical: s.md,
    marginTop: s.sm,
  },
  helpText: {
    flex: 0,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
