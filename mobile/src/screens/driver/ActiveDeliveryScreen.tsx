// ==========================================
// DEVOLÓN — Entrega activa
//
// Hero placeholder dark de mapa (cuando se integre react-native-maps,
// se reemplaza solo el contenido del mapHero, el resto del layout
// queda igual). Step indicator vertical, task card glass con CTAs
// llamar/navegar, detalle del pedido y pago. Action bar pegada abajo
// con CTA primario glow.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ordersApi, driverApi, messagesApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { Card, Header } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const DELIVERY_STEPS: {
  status: OrderStatus;
  label: string;
  icon: keyof typeof import('@expo/vector-icons/build/Ionicons').default.glyphMap;
}[] = [
  { status: 'driver_assigned', label: 'Ir al restaurante', icon: 'restaurant' },
  { status: 'picked_up', label: 'Recoger pedido', icon: 'bag-check' },
  { status: 'on_the_way', label: 'Entregar al cliente', icon: 'location' },
  { status: 'delivered', label: 'Entrega completada', icon: 'checkmark-circle' },
];

export default function ActiveDeliveryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  // Polling para detectar cuando la cocina marca el pedido como listo
  // (status pasa de confirmed/preparing → ready_for_pickup / driver_assigned).
  // Si ya está en pickup/delivery, ese useEffect del GPS toma el control.
  useEffect(() => {
    if (!order) return;
    if (
      order.status !== 'confirmed' &&
      order.status !== 'preparing' &&
      order.status !== 'driver_assigned' &&
      order.status !== 'ready_for_pickup'
    ) {
      return;
    }
    const interval = setInterval(() => {
      loadOrder();
    }, 10000);
    return () => clearInterval(interval);
  }, [order?.status]);

  // ============================================
  // GEO-TRACKING — Mientras el driver tiene el pedido en tránsito
  // (status picked_up), envía su location al backend cada 15s. El
  // backend calcula distancia al destino y notifica al cliente cuando
  // cruza umbrales de proximidad ("está cerca" / "ya llegó").
  // ============================================
  useEffect(() => {
    if (order?.status !== 'picked_up') return;

    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const tick = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        await driverApi.updateLocation(pos.coords.latitude, pos.coords.longitude);
      } catch {
        /* silent — fallos de GPS no deben romper la pantalla */
      }
    };

    // primera lectura inmediata + intervalo
    tick();
    interval = setInterval(tick, 15000);
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [order?.status]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(orderId);
      setOrder(data);
      updateCurrentStep(data.status);
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const updateCurrentStep = (status: OrderStatus) => {
    const stepIndex = DELIVERY_STEPS.findIndex((s) => s.status === status);
    setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
  };

  const handlePickedUp = async () => {
    Alert.alert('Confirmar recogida', '¿Ya recogiste el pedido del restaurante?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, lo tengo',
        onPress: async () => {
          try {
            await ordersApi.markPickedUp(orderId);
            loadOrder();
          } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar el pedido');
          }
        },
      },
    ]);
  };

  const handleDelivered = async () => {
    Alert.alert('Confirmar entrega', '¿Ya entregaste el pedido al cliente?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, entregado',
        onPress: async () => {
          try {
            await ordersApi.markDelivered(orderId);
            Alert.alert(
              'Entrega completada',
              '¡Excelente trabajo! El pago se agregará a tus ganancias.',
              [{ text: 'OK', onPress: () => navigation.goBack() }],
            );
          } catch (error) {
            Alert.alert('Error', 'No se pudo completar la entrega');
          }
        },
      },
    ]);
  };

  const openMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Abre el chat con el participante indicado (restaurant o customer).
  // Resuelve el userId del otro lado vía /messages/participants si no
  // viene en el objeto order — más robusto contra shapes incompletas.
  const openChatWith = async (
    role: 'customer' | 'driver' | 'restaurant',
    fallbackName?: string,
  ) => {
    try {
      const participants = await messagesApi.getParticipants(order.id);
      const target = participants.find((p: any) => p.role === role);
      if (!target) {
        Alert.alert(
          'Sin chat disponible',
          role === 'restaurant'
            ? 'No se puede contactar al restaurante en este momento.'
            : 'No se puede contactar al cliente en este momento.',
        );
        return;
      }
      navigation.navigate('Chat', {
        orderId: order.id,
        otherUserId: target.userId,
        otherUserName:
          fallbackName ||
          (role === 'restaurant'
            ? order.restaurant?.name
            : order.customer?.name) ||
          'Conversación',
        otherUserRole: role,
        orderNumber: `DVL-${order.orderNumber}`,
      });
    } catch (error: any) {
      Alert.alert(
        'No se pudo abrir el chat',
        error?.response?.data?.message || 'Intenta de nuevo.',
      );
    }
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const formatCurrency = (amount: any) => {
    const n = Number(amount);
    return `$${(isFinite(n) ? n : 0).toFixed(2)}`;
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Header title="Cargando…" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Preparando entrega…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Driver va al restaurante mientras el pedido esté en cualquier
  // estado pre-pickup: confirmed/preparing (claim early), ready_for_pickup
  // (recoger ya), driver_assigned (ya promocionado para recoger).
  const isAtRestaurant =
    order.status === 'confirmed' ||
    order.status === 'preparing' ||
    order.status === 'driver_assigned' ||
    order.status === 'ready_for_pickup';
  const isOnTheWay = order.status === 'picked_up' || order.status === 'on_the_way';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        eyebrow="ENTREGA ACTIVA"
        title={`DVL-${order.orderNumber}`}
        rightIcon="ellipsis-vertical"
        onRightPress={() => {}}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        {/* ============ MAP HERO (placeholder dark) ============ */}
        <View style={styles.mapHero}>
          <View style={styles.mapGrid}>
            <Ionicons name="map-outline" size={64} color={colors.textFaint} />
            <Text style={styles.mapHint}>
              {isAtRestaurant ? 'Ruta al restaurante' : 'Ruta al cliente'}
            </Text>
          </View>
          <View style={styles.mapPin}>
            <View style={styles.mapPinDot} />
            <View style={styles.mapPinRing} />
          </View>
        </View>

        {/* ============ STEP TRACKER ============ */}
        <Card variant="glass" padding={s.lg} borderRadius={radius.xl} style={styles.stepsCard}>
          <Text style={styles.stepsEyebrow}>PROGRESO</Text>
          {DELIVERY_STEPS.map((step, index) => {
            const isPast = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <View key={step.status} style={styles.stepRow}>
                <View style={styles.stepIndicator}>
                  <View
                    style={[
                      styles.stepDot,
                      isPast && styles.stepDotPast,
                      isCurrent && styles.stepDotCurrent,
                    ]}
                  >
                    {isPast ? (
                      <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
                    ) : (
                      <Ionicons
                        name={step.icon}
                        size={14}
                        color={isCurrent ? colors.onPrimary : colors.textFaint}
                      />
                    )}
                  </View>
                  {index < DELIVERY_STEPS.length - 1 && (
                    <View
                      style={[styles.stepLine, isPast && styles.stepLineActive]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (isPast || isCurrent) && styles.stepLabelActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </Card>

        {/* ============ TASK CARD — todos los accesos blindados con ?. ============ */}
        <Card variant="raised" padding={s.lg} borderRadius={radius.xl} style={styles.taskCard}>
          {isAtRestaurant ? (
            <>
              <View style={styles.taskHeader}>
                <View style={styles.taskHalo}>
                  <Ionicons name="restaurant" size={22} color={colors.primary} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskEyebrow}>RECOGER EN</Text>
                  <Text style={styles.taskName} numberOfLines={1}>
                    {String(order.restaurant?.name ?? 'Restaurante')}
                  </Text>
                </View>
              </View>
              <Text style={styles.taskAddress}>
                {String(order.restaurant?.address?.street ?? '')}
              </Text>
              <View style={styles.taskActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.taskBtnIcon}
                  onPress={() =>
                    openChatWith('restaurant', order.restaurant?.name)
                  }
                >
                  <Ionicons name="chatbubble" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.taskBtnSecondary}
                  onPress={() =>
                    order.restaurant?.phone && callPhone(order.restaurant.phone)
                  }
                >
                  <Ionicons name="call" size={18} color={colors.primary} />
                  <Text style={styles.taskBtnSecondaryText}>LLAMAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.taskBtnPrimary}
                  onPress={() => {
                    const loc = order.restaurant?.address?.location;
                    if (loc?.latitude && loc?.longitude) {
                      openMaps(loc.latitude, loc.longitude);
                    }
                  }}
                >
                  <Ionicons name="navigate" size={18} color={colors.onPrimary} />
                  <Text style={styles.taskBtnPrimaryText}>NAVEGAR</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.taskHeader}>
                <View style={[styles.taskHalo, styles.taskHaloSuccess]}>
                  <Ionicons name="location" size={22} color={colors.success} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskEyebrow}>ENTREGAR A</Text>
                  <Text style={styles.taskName} numberOfLines={1}>
                    {String(order.customer?.name ?? 'Cliente')}
                  </Text>
                </View>
              </View>
              <Text style={styles.taskAddress}>
                {String(order.deliveryAddress?.street ?? '')}{' '}
                {String(order.deliveryAddress?.number ?? '')}
              </Text>
              {order.deliveryAddress?.reference && (
                <Text style={styles.taskReference}>
                  Ref: {String(order.deliveryAddress.reference)}
                </Text>
              )}
              <View style={styles.taskActions}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.taskBtnIcon}
                  onPress={() =>
                    openChatWith('customer', order.customer?.name)
                  }
                >
                  <Ionicons name="chatbubble" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.taskBtnSecondary}
                  onPress={() =>
                    order.customer?.phone && callPhone(order.customer.phone)
                  }
                >
                  <Ionicons name="call" size={18} color={colors.primary} />
                  <Text style={styles.taskBtnSecondaryText}>LLAMAR</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.taskBtnPrimary}
                  onPress={() => {
                    const loc = order.deliveryAddress?.location;
                    if (loc?.latitude && loc?.longitude) {
                      openMaps(loc.latitude, loc.longitude);
                    }
                  }}
                >
                  <Ionicons name="navigate" size={18} color={colors.onPrimary} />
                  <Text style={styles.taskBtnPrimaryText}>NAVEGAR</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Card>

        {/* ============ ORDER DETAILS ============ */}
        <Card variant="glass" padding={s.lg} borderRadius={radius.xl} style={styles.detailsCard}>
          <Text style={styles.sectionEyebrow}>PEDIDO</Text>
          <Text style={styles.sectionTitle}>Productos</Text>
          {(order.items || []).map((item: any, index: number) => {
            const safe = item || {};
            // Backend a veces no incluye la relacion product; fallback a
            // productName guardado directamente en el OrderItem, o '—'.
            const name =
              safe.product?.name ||
              safe.productName ||
              safe.name ||
              'Producto';
            const qty = safe.quantity ?? 1;
            return (
              <View key={safe.id ?? index} style={styles.itemRow}>
                <Text style={styles.itemQuantity}>{qty}×</Text>
                <Text style={styles.itemName} numberOfLines={2}>
                  {String(name)}
                </Text>
              </View>
            );
          })}
          {/* Notas del cliente sobre la comida — el driver las ve para
              verificar que el restaurante haya preparado bien el pedido. */}
          {((order as any).customerNotes || (order as any).specialInstructions) && (
            <View style={styles.notesBlockKitchen}>
              <View style={styles.notesBlockHeader}>
                <Ionicons name="restaurant" size={13} color={colors.primary} />
                <Text style={styles.notesBlockEyebrow}>NOTAS DEL CLIENTE</Text>
              </View>
              <Text style={styles.notesBlockText}>
                {(order as any).customerNotes ||
                  (order as any).specialInstructions}
              </Text>
            </View>
          )}
          {/* Indicaciones del domicilio — útiles cuando el driver va a entregar. */}
          {(order as any).deliveryInstructions && (
            <View style={styles.notesBlockDelivery}>
              <View style={styles.notesBlockHeader}>
                <Ionicons name="location" size={13} color={colors.info} />
                <Text
                  style={[styles.notesBlockEyebrow, { color: colors.info }]}
                >
                  INDICACIONES DE ENTREGA
                </Text>
              </View>
              <Text style={styles.notesBlockText}>
                {(order as any).deliveryInstructions}
              </Text>
            </View>
          )}
        </Card>

        {/* ============ PAYMENT ============ */}
        <Card variant="glass" padding={s.lg} borderRadius={radius.xl} style={styles.paymentCard}>
          <Text style={styles.sectionEyebrow}>COBRO</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Método de pago</Text>
            <View style={styles.paymentMethod}>
              <Ionicons
                name={order.paymentMethod === 'cash' ? 'cash' : 'card'}
                size={14}
                color={colors.text}
              />
              <Text style={styles.paymentMethodText}>
                {order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
              </Text>
            </View>
          </View>

          {order.paymentMethod === 'cash' && (
            <View style={styles.cashWarning}>
              <Ionicons name="warning" size={14} color={colors.primary} />
              <Text style={styles.cashWarningText}>
                Cobrar {formatCurrency(order.total)} en efectivo
              </Text>
            </View>
          )}

          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Tu ganancia</Text>
            <Text style={styles.earningsValue}>
              {formatCurrency(order.deliveryFee + (order.tip || 0))}
            </Text>
          </View>
          {order.tip > 0 && (
            <Text style={styles.tipText}>
              Incluye propina de {formatCurrency(order.tip)}
            </Text>
          )}
        </Card>
      </ScrollView>

      {/* ============ ACTION BAR ============
          - Mientras la cocina aún cocina (confirmed/preparing): botón
            deshabilitado con copy "Esperando a que esté listo".
          - Cuando ya está listo o asignado: "CONFIRMAR RECOGIDA".
          - Tras pickup: "CONFIRMAR ENTREGA". */}
      <View style={styles.actionBar}>
        {(() => {
          const waitingForKitchen =
            order.status === 'confirmed' || order.status === 'preparing';
          if (waitingForKitchen) {
            return (
              <View style={[styles.actionBtn, styles.actionBtnWaiting]}>
                <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.actionBtnText, styles.actionBtnTextWaiting]}>
                  ESPERANDO A QUE ESTÉ LISTO
                </Text>
              </View>
            );
          }
          if (isAtRestaurant) {
            return (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.actionBtn}
                onPress={handlePickedUp}
              >
                <Ionicons name="bag-check" size={20} color={colors.onPrimary} />
                <Text style={styles.actionBtnText}>CONFIRMAR RECOGIDA</Text>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              activeOpacity={0.88}
              style={[styles.actionBtn, styles.actionBtnDeliver]}
              onPress={handleDelivered}
            >
              <Ionicons name="checkmark-circle" size={20} color={colors.text} />
              <Text style={[styles.actionBtnText, styles.actionBtnTextDeliver]}>
                CONFIRMAR ENTREGA
              </Text>
            </TouchableOpacity>
          );
        })()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },

  // ============ MAP HERO ============
  mapHero: {
    height: 220,
    marginHorizontal: s.xl,
    marginTop: s.sm,
    borderRadius: radius['2xl'],
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapGrid: { alignItems: 'center', gap: s.xs },
  mapHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    textTransform: 'uppercase',
  },
  mapPin: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinDot: {
    width: 14,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  mapPinRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: 'rgba(255,194,14,0.35)',
  },

  // ============ STEPS ============
  stepsCard: {
    marginHorizontal: s.xl,
    marginTop: s.md,
  },
  stepsEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: s.sm,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotPast: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  stepDotCurrent: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow,
  },
  stepLine: {
    width: 2,
    height: 22,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  stepLineActive: { backgroundColor: colors.success },
  stepLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    paddingTop: 5,
    paddingBottom: s.sm,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: fontWeight.heavy,
  },

  // ============ TASK CARD ============
  taskCard: {
    marginHorizontal: s.xl,
    marginTop: s.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  taskHalo: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskHaloSuccess: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderColor: 'rgba(31,174,111,0.32)',
  },
  taskInfo: { flex: 1 },
  taskEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  taskName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  taskAddress: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: s.sm,
  },
  taskReference: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    marginTop: s.xs,
  },
  taskActions: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.md,
  },
  // Botón icon-only para el chat — más compacto que taskBtnSecondary.
  taskBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.35)',
  },
  taskBtnSecondaryText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
  taskBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  taskBtnPrimaryText: {
    color: colors.onPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },

  // ============ DETAILS ============
  detailsCard: {
    marginHorizontal: s.xl,
    marginTop: s.sm,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: s.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    paddingVertical: s.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemQuantity: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    width: 30,
  },
  itemName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  // Notas del cliente sobre la comida (estilo amarillo highlight).
  notesBlockKitchen: {
    backgroundColor: 'rgba(255,194,14,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.40)',
    padding: s.sm,
    borderRadius: radius.md,
    marginTop: s.sm,
  },
  // Indicaciones del domicilio (estilo azul info).
  notesBlockDelivery: {
    backgroundColor: 'rgba(74,144,226,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(74,144,226,0.40)',
    padding: s.sm,
    borderRadius: radius.md,
    marginTop: s.xs,
  },
  notesBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  notesBlockEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  notesBlockText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },

  // ============ PAYMENT ============
  paymentCard: {
    marginHorizontal: s.xl,
    marginTop: s.sm,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  paymentLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  cashWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    backgroundColor: 'rgba(255,194,14,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    borderRadius: radius.md,
    marginTop: s.sm,
  },
  cashWarningText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s.md,
    paddingTop: s.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  earningsLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  earningsValue: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: 'right',
    marginTop: 4,
  },

  // ============ ACTION BAR ============
  actionBar: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  actionBtnDeliver: {
    backgroundColor: colors.success,
  },
  // Estado "cocina aún preparando" — visible pero no clickeable.
  actionBtnWaiting: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  actionBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
  actionBtnTextDeliver: { color: colors.text },
  actionBtnTextWaiting: { color: colors.textMuted },
});
