// ==========================================
// DEVOLÓN — Driver Home (Uber-style fullscreen layout)
//
// El mapa/radar ocupa TODA la pantalla. Encima se montan overlays:
//   • TOP: header transparente con greeting + status + avatar
//   • CENTER-RIGHT: FAB grande GO/STOP — el toggle principal
//   • BOTTOM: card glass con stats + lista de pedidos disponibles
//
// Sin Google Maps API: el componente RadarHero pinta un radar estilizado
// dark con anillos pulsantes amarillos cuando el driver está online.
// Cuando se integre `react-native-maps`, reemplazar `<RadarHero ... />`
// por `<MapView>` manteniendo el resto del layout idéntico.
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { driverApi, ordersApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { DriverStatus, Order } from '../../types';
import { Card } from '../../components/ui';
import RadarHero from './RadarHero';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

export default function DriverHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const [status, setStatus] = useState<DriverStatus>('offline');
  const [currentLocation, setCurrentLocation] =
    useState<Location.LocationObject | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [earnings, setEarnings] = useState<any>({
    today: 0,
    pending: 0,
    deliveries: 0,
  });
  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkActiveDelivery();
    loadEarnings();
  }, []);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let ordersInterval: ReturnType<typeof setInterval> | null = null;

    if (status === 'online') {
      startLocationTracking().then((sub) => {
        locationSubscription = sub;
      });
      ordersInterval = setInterval(loadAvailableOrders, 10000);
      loadAvailableOrders();
    }
    return () => {
      if (locationSubscription) locationSubscription.remove();
      if (ordersInterval) clearInterval(ordersInterval);
    };
  }, [status]);

  const startLocationTracking = async () => {
    const { status: permStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert(
        'Permiso denegado',
        'Necesitamos tu ubicación para asignarte pedidos cercanos.',
      );
      return null;
    }
    return Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        setCurrentLocation(location);
        driverApi
          .updateLocation(location.coords.latitude, location.coords.longitude)
          .catch(() => {
            /* silent */
          });
      },
    );
  };

  const checkActiveDelivery = async () => {
    try {
      const order = await ordersApi.getActiveDelivery();
      if (order) {
        setActiveOrder(order);
        setStatus('busy');
      }
    } catch {
      /* sin entrega activa */
    }
  };

  const loadAvailableOrders = async () => {
    try {
      // Si no hay location, intentamos sin coords (backend filtra por estado).
      const lat = currentLocation?.coords?.latitude;
      const lng = currentLocation?.coords?.longitude;
      const orders = await ordersApi.getAvailableOrders(lat, lng, 5);
      setAvailableOrders(orders || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadEarnings = async () => {
    try {
      const data: any = await driverApi.getEarnings('day');
      // El backend devuelve {totalOrders, totalEarnings, orders[]}. Mapeamos.
      setEarnings({
        today: data?.totalEarnings ?? data?.today ?? 0,
        deliveries: data?.totalOrders ?? data?.deliveries ?? 0,
        pending: data?.pending ?? 0,
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const toggleStatus = async () => {
    // Optimistic update con pulso del FAB para feedback inmediato.
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(fabScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    const newStatus: DriverStatus = status === 'offline' ? 'online' : 'offline';
    setStatus(newStatus);
    try {
      await driverApi.updateStatus(newStatus);
    } catch (error: any) {
      setStatus(status); // revert
      Alert.alert(
        'No se pudo actualizar',
        error?.response?.data?.message ||
          'Verifica tu conexión e intenta de nuevo.',
      );
    }
  };

  const handleAcceptOrder = async (order: Order) => {
    try {
      await ordersApi.acceptDelivery(order.id);
      setActiveOrder(order);
      setStatus('busy');
      navigation.navigate('ActiveDelivery', { orderId: order.id });
    } catch {
      Alert.alert(
        'No se pudo aceptar',
        'Otro repartidor pudo haberlo tomado. Refresca la lista.',
      );
      loadAvailableOrders();
    }
  };

  // Bulletproof: maneja string/number/undefined/null/NaN/objetos/arrays.
  // Number(obj) y Number(arr) devuelven NaN → isFinite false → fallback 0.
  const formatCurrency = (amount: any) => {
    const n = Number(amount);
    return `$${(isFinite(n) ? n : 0).toFixed(2)}`;
  };

  const isOnline = status === 'online';
  const isBusy = status === 'busy';
  const statusLabel = isBusy
    ? 'En entrega'
    : isOnline
      ? 'Buscando pedidos'
      : 'Desconectado';

  return (
    <View style={styles.root}>
      {/* ============ MAPA FULLSCREEN (capa de fondo absoluta) ============
          absoluteFill garantiza que ocupe toda la pantalla detrás de los
          overlays, sin depender del flexbox del root. */}
      <View style={styles.mapBackground} pointerEvents="none">
        <RadarHero
          fullscreen
          online={isOnline}
          ordersNearby={availableOrders.length}
        />
      </View>

      {/* ============ TOP HEADER OVERLAY ============ */}
      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.statusChip}>
              <View
                style={[
                  styles.statusDot,
                  isOnline && styles.statusDotOnline,
                  isBusy && styles.statusDotBusy,
                ]}
              />
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
            <Text style={styles.greeting} numberOfLines={1}>
              Hola, {user?.name?.split(' ')[0] || 'rider'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <Ionicons name="person" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ============ ACTIVE DELIVERY BANNER (si hay entrega activa) ============ */}
      {activeOrder && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.activeBanner}
          onPress={() =>
            navigation.navigate('ActiveDelivery', { orderId: activeOrder.id })
          }
        >
          <View style={styles.activeIcon}>
            <Ionicons name="bicycle" size={22} color={colors.onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeEyebrow}>ENTREGA ACTIVA</Text>
            <Text style={styles.activeTitle}>
              #{activeOrder.orderNumber} · Toca para continuar
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
      )}

      {/* ============ FAB GO/STOP (toggle principal) ============ */}
      {!isBusy && (
        <Animated.View
          style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}
        >
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={toggleStatus}
            style={[styles.fab, isOnline ? styles.fabOnline : styles.fabOffline]}
          >
            <Ionicons
              name={isOnline ? 'pause' : 'power'}
              size={28}
              color={isOnline ? colors.onPrimary : colors.text}
            />
            <Text
              style={[
                styles.fabLabel,
                isOnline && styles.fabLabelOnline,
              ]}
            >
              {isOnline ? 'PAUSAR' : 'CONECTAR'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ============ BOTTOM SHEET con stats + pedidos ============ */}
      <View style={styles.bottomSheet} pointerEvents="box-none">
        <View style={styles.sheetHandle} />

        {/* Stats compactos */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatCurrency(earnings.today)}</Text>
            <Text style={styles.statLabel}>HOY</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{earnings.deliveries}</Text>
            <Text style={styles.statLabel}>ENTREGAS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {formatCurrency(earnings.pending)}
            </Text>
            <Text style={styles.statLabel}>POR PAGAR</Text>
          </View>
        </View>

        {/* Lista de pedidos disponibles */}
        {isOnline && availableOrders.length > 0 && (
          <View style={styles.ordersBlock}>
            <View style={styles.ordersHeader}>
              <Text style={styles.ordersEyebrow}>CERCA DE TI</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('AvailableOrders')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.ordersAction}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 160 }}
            >
              {availableOrders.slice(0, 2).map((order: any) => {
                // Estado de cocina visible para el rider: confirmado /
                // preparando / listo. Permite hacer claim early antes de
                // que la comida esté lista y empezar a acercarse.
                const status = order?.status as string;
                const kitchen =
                  status === 'ready_for_pickup'
                    ? { label: 'LISTO', tint: colors.success, icon: 'checkmark-circle' as const }
                    : status === 'preparing'
                      ? { label: 'EN COCINA', tint: colors.primary, icon: 'flame' as const }
                      : { label: 'CONFIRMADO', tint: colors.info, icon: 'time' as const };

                // Tiempo desde que el restaurante confirmó/empezó a preparar
                const tsRaw = order?.preparingAt || order?.confirmedAt;
                let ageMin = 0;
                if (tsRaw) {
                  const t = new Date(tsRaw).getTime();
                  if (!isNaN(t)) ageMin = Math.max(0, Math.round((Date.now() - t) / 60000));
                }
                const ageLabel =
                  status === 'ready_for_pickup'
                    ? 'Recoge ya'
                    : ageMin === 0
                      ? 'Hace instantes'
                      : `Hace ${ageMin} min`;

                return (
                  <Card
                    key={order.id}
                    variant="glass"
                    padding={s.md}
                    borderRadius={radius.lg}
                    style={styles.orderCard}
                  >
                    <View style={styles.orderTop}>
                      <View style={styles.orderIcon}>
                        <Ionicons name="restaurant" size={14} color={colors.primary} />
                      </View>
                      <Text style={styles.orderRestaurant} numberOfLines={1}>
                        {order.restaurant?.name || 'Restaurante'}
                      </Text>
                      <Text style={styles.orderEarn}>
                        {formatCurrency(
                          (Number(order.deliveryFee) || 0) +
                            (Number(order.tip) || 0),
                        )}
                      </Text>
                    </View>

                    {/* Chip de status de cocina + tiempo */}
                    <View style={styles.orderStatusRow}>
                      <View
                        style={[
                          styles.kitchenChip,
                          { borderColor: `${kitchen.tint}55`, backgroundColor: `${kitchen.tint}1A` },
                        ]}
                      >
                        <Ionicons name={kitchen.icon} size={11} color={kitchen.tint} />
                        <Text style={[styles.kitchenChipText, { color: kitchen.tint }]}>
                          {kitchen.label}
                        </Text>
                      </View>
                      <Text style={styles.orderMetaText}>{ageLabel}</Text>
                    </View>

                    <View style={styles.orderMeta}>
                      <Ionicons name="bag-outline" size={11} color={colors.textMuted} />
                      <Text style={styles.orderMetaText}>
                        {order.items?.length ?? 0} items
                      </Text>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity
                        style={styles.miniAcceptBtn}
                        activeOpacity={0.85}
                        onPress={() => handleAcceptOrder(order)}
                      >
                        <Text style={styles.miniAcceptText}>
                          {status === 'ready_for_pickup' ? 'RECOGER' : 'TOMAR'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Estado vacío: online sin pedidos / offline */}
        {isOnline && availableOrders.length === 0 && (
          <Text style={styles.emptyHint}>
            Buscando pedidos cerca…
          </Text>
        )}
        {!isOnline && !isBusy && (
          <Text style={styles.emptyHint}>
            Toca CONECTAR para empezar a recibir pedidos.
          </Text>
        )}
      </View>
    </View>
  );
}

const FAB_SIZE = 84;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  // El mapa va como background absoluto cubriendo TODA la pantalla.
  // pointerEvents="none" deja que los taps pasen a los overlays encima.
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },

  // ============ TOP HEADER (overlay) ============
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: s.md,
    paddingTop: s.sm,
  },
  headerLeft: { flex: 1, gap: s.xs },
  statusChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  statusDotOnline: { backgroundColor: colors.success },
  statusDotBusy: { backgroundColor: colors.primary },
  statusText: {
    color: colors.text,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    paddingHorizontal: s.xs,
    // sombra de texto para que se lea sobre el mapa
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowRadius: 8,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ ACTIVE DELIVERY BANNER ============
  activeBanner: {
    position: 'absolute',
    top: 110,
    left: s.md,
    right: s.md,
    zIndex: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    padding: s.md,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  activeIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeEyebrow: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  activeTitle: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // ============ FAB GO/STOP ============
  // Se monta sobre el bottom sheet. Si el sheet tiene ~180px de alto,
  // el FAB queda flotando ~40px arriba del borde del sheet.
  fabWrap: {
    position: 'absolute',
    bottom: 210,
    alignSelf: 'center',
    zIndex: 11,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  fabOffline: {
    backgroundColor: colors.bgRaised,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  fabOnline: {
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  fabLabel: {
    color: colors.text,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  fabLabelOnline: { color: colors.onPrimary },

  // ============ BOTTOM SHEET ============
  // Sheet más bajo (~190px) para que el mapa tenga más protagonismo.
  // El user puede expandir manualmente si lista de pedidos crece — el
  // scrollview interno absorbe el contenido extra hasta maxHeight.
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgRaised,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.lg,
    minHeight: 190,
    zIndex: 5,
    ...shadows.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: s.md,
  },

  // ============ STATS ============
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.sm,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },

  // ============ ORDERS LIST ============
  ordersBlock: {
    marginTop: s.md,
    paddingTop: s.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.sm,
  },
  ordersEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  ordersAction: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  orderCard: { marginBottom: s.xs },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  orderIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderRestaurant: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  orderEarn: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  orderStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  kitchenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  kitchenChipText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.6,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: s.xs,
  },
  orderMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
  },
  orderMetaSep: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
  },
  miniAcceptBtn: {
    paddingHorizontal: s.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  miniAcceptText: {
    color: colors.onPrimary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 1,
  },

  // ============ EMPTY HINT ============
  emptyHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginTop: s.md,
    paddingHorizontal: s.lg,
  },
});
