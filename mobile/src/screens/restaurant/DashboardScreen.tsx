// ==========================================
// DEVOLÓN — Restaurant Dashboard
// Hero del negocio: estado, ventas del día, pedidos pendientes y accesos.
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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { restaurantsApi, ordersApi } from '../../services/api';
import { Order, Restaurant } from '../../types';
import { Card, Button, Section, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
  shadows,
} from '../../theme';

export default function RestaurantDashboardScreen() {
  const navigation = useNavigation<any>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  // `isOpen` = abierto/cerrado temporal (toggle del dueño). El campo
  // que solo admin maneja (suspensión de cuenta) es distinto.
  const [isOpen, setIsOpen] = useState(false);
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
      setIsOpen(!!restaurantData?.isOpen);
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
    // Optimistic update: toggle el state local primero para que el UI
    // responda inmediato. Si el backend falla, revertimos y mostramos
    // alerta — antes el catch silencioso causaba que el switch "saltara"
    // de vuelta sin que el user supiera por qué.
    const next = !isOpen;
    setIsOpen(next);
    try {
      await restaurantsApi.updateAvailability(next);
    } catch (error: any) {
      setIsOpen(!next); // revert
      Alert.alert(
        'No se pudo actualizar',
        error?.response?.data?.message ||
          'Tu negocio no se pudo abrir/cerrar. Intenta de nuevo.',
      );
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(n ?? 0).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ============ HEADER ============ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>DEVOLÓN · NEGOCIO</Text>
            <Text style={styles.greeting} numberOfLines={1}>
              {restaurant?.name || 'Mi Negocio'}
            </Text>
            <View style={styles.headerStatusRow}>
              <View
                style={[
                  styles.headerStatusDot,
                  { backgroundColor: isOpen ? colors.success : colors.textFaint },
                ]}
              />
              <Text style={styles.headerStatusText}>
                {isOpen ? 'En línea' : 'Cerrado'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Orders')}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {pendingOrders.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingOrders.length > 9 ? '9+' : pendingOrders.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* ============ STATUS CARD ============ */}
          <Card variant="glass" padding={s.lg} borderRadius={radius.xl} style={styles.statusCard}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusHalo,
                  {
                    backgroundColor: isOpen
                      ? 'rgba(31,174,111,0.12)'
                      : 'rgba(255,255,255,0.04)',
                    borderColor: isOpen
                      ? 'rgba(31,174,111,0.32)'
                      : colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={isOpen ? 'flash' : 'moon-outline'}
                  size={18}
                  color={isOpen ? colors.success : colors.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.statusTitle}>
                  {isOpen ? 'Recibiendo pedidos' : 'Negocio cerrado'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {isOpen
                    ? 'Los clientes pueden ordenar.'
                    : 'No recibirás pedidos nuevos.'}
                </Text>
              </View>
            </View>
            <Switch
              value={isOpen}
              onValueChange={toggleActive}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </Card>

          {/* ============ HERO METRIC ============ */}
          <Card
            variant="raised"
            padding={s.xl}
            borderRadius={radius['2xl']}
            style={styles.heroCard}
          >
            <Text style={styles.heroEyebrow}>VENTAS HOY</Text>
            <Text style={styles.heroValue}>{formatCurrency(stats.todaySales)}</Text>
            <View style={styles.heroMetaRow}>
              <View style={styles.heroMeta}>
                <Ionicons name="receipt-outline" size={13} color={colors.textMuted} />
                <Text style={styles.heroMetaText}>
                  {stats.todayOrders} pedido{stats.todayOrders === 1 ? '' : 's'}
                </Text>
              </View>
              <View style={styles.heroMeta}>
                <Ionicons name="star" size={13} color={colors.primary} />
                <Text style={styles.heroMetaText}>
                  {(Number(restaurant?.rating) || 0).toFixed(1)} ·{' '}
                  {restaurant?.totalReviews || 0} reseñas
                </Text>
              </View>
            </View>
          </Card>

          {/* ============ STATS GRID — clickeables, llevan a Pedidos ============ */}
          <View style={styles.statsGrid}>
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.xl}
              onPress={() => navigation.navigate('Orders')}
              style={styles.statCard}
            >
              <View style={[styles.statIcon, styles.statIconPrimary]}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.pendingOrders ?? 0}</Text>
              <Text style={styles.statLabel}>POR CONFIRMAR</Text>
            </Card>
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.xl}
              onPress={() => navigation.navigate('Orders')}
              style={styles.statCard}
            >
              <View style={[styles.statIcon, styles.statIconInfo]}>
                <Ionicons name="flame-outline" size={16} color={colors.info} />
              </View>
              <Text style={styles.statValue}>{stats.preparingOrders ?? 0}</Text>
              <Text style={styles.statLabel}>PREPARANDO</Text>
            </Card>
          </View>

          {/* ============ PENDING ORDERS ============ */}
          <Section
            title="Pedidos pendientes"
            eyebrow="EN VIVO"
            actionLabel={pendingOrders.length > 0 ? 'Ver todos →' : undefined}
            onActionPress={() => navigation.navigate('Orders')}
            spacing={s.xl}
          >
            {pendingOrders.length === 0 ? (
              <Card variant="glass" padding={s.xl} borderRadius={radius.xl} style={styles.allClearCard}>
                <View style={styles.allClearHalo}>
                  <Ionicons name="checkmark-done" size={22} color={colors.success} />
                </View>
                <Text style={styles.allClearTitle}>Todo al día</Text>
                <Text style={styles.allClearSubtitle}>
                  No hay pedidos pendientes por confirmar.
                </Text>
              </Card>
            ) : (
              pendingOrders.slice(0, 3).map((order) => {
                const customerName =
                  (order as any).customer?.name ||
                  [
                    (order as any).customer?.firstName,
                    (order as any).customer?.lastName,
                  ]
                    .filter(Boolean)
                    .join(' ') ||
                  'Cliente';
                const itemCount = order.items?.length ?? 0;

                const handleAccept = async () => {
                  try {
                    await ordersApi.acceptOrder(order.id);
                    await loadData();
                  } catch (e: any) {
                    Alert.alert(
                      'No se pudo aceptar',
                      e?.response?.data?.message || 'Intenta de nuevo.',
                    );
                  }
                };

                const handleReject = () => {
                  Alert.alert(
                    'Rechazar pedido',
                    `¿Rechazar #${order.orderNumber}? El cliente recibirá una notificación.`,
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Rechazar',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await ordersApi.rejectOrder(
                              order.id,
                              'Rechazado por el restaurante',
                            );
                            await loadData();
                          } catch (e: any) {
                            Alert.alert(
                              'No se pudo rechazar',
                              e?.response?.data?.message || 'Intenta de nuevo.',
                            );
                          }
                        },
                      },
                    ],
                  );
                };

                return (
                  <Card
                    key={order.id}
                    variant="glass"
                    padding={s.lg}
                    borderRadius={radius.xl}
                    onPress={() =>
                      navigation.navigate('OrderDetail', { orderId: order.id })
                    }
                    style={styles.orderCard}
                  >
                    <View style={styles.orderHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                        <Text style={styles.orderCustomer} numberOfLines={1}>
                          {customerName}
                        </Text>
                      </View>
                      <View style={styles.newBadge}>
                        <View style={styles.newDot} />
                        <Text style={styles.newBadgeText}>NUEVO</Text>
                      </View>
                    </View>

                    <View style={styles.orderMetaRow}>
                      <View style={styles.orderMetaPill}>
                        <Ionicons
                          name="cube-outline"
                          size={11}
                          color={colors.textMuted}
                        />
                        <Text style={styles.orderMetaText}>
                          {itemCount} producto{itemCount === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Text style={styles.orderTotal}>
                        {formatCurrency(order.total)}
                      </Text>
                    </View>

                    <View style={styles.orderActions}>
                      <View style={styles.orderActionItem}>
                        <Button
                          label="Rechazar"
                          variant="secondary"
                          size="md"
                          onPress={handleReject}
                        />
                      </View>
                      <View style={styles.orderActionItem}>
                        <Button
                          label="Aceptar"
                          variant="primary"
                          size="md"
                          onPress={handleAccept}
                        />
                      </View>
                    </View>
                  </Card>
                );
              })
            )}
          </Section>

          {/* ============ QUICK ACTIONS ============ */}
          <Section title="Accesos rápidos" eyebrow="HERRAMIENTAS" spacing={s.lg}>
            <View style={styles.actionsGrid}>
              <Card
                variant="glass"
                padding={s.md}
                borderRadius={radius.xl}
                onPress={() => navigation.navigate('Menu')}
                style={styles.actionCard}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.actionText}>Menú</Text>
              </Card>
              <Card
                variant="glass"
                padding={s.md}
                borderRadius={radius.xl}
                onPress={() => navigation.navigate('Stats')}
                style={styles.actionCard}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="stats-chart-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.actionText}>Estadísticas</Text>
              </Card>
              <Card
                variant="glass"
                padding={s.md}
                borderRadius={radius.xl}
                onPress={() => navigation.navigate('Profile')}
                style={styles.actionCard}
              >
                <View style={styles.actionIcon}>
                  <Ionicons name="settings-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.actionText}>Configuración</Text>
              </Card>
            </View>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ HEADER ============
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  headerStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  headerStatusText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: fontWeight.black,
  },

  // ============ BODY ============
  body: {
    paddingHorizontal: s.xl,
  },

  // ============ STATUS CARD ============
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s.md,
    marginBottom: s.md,
  },
  statusLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  statusHalo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  statusSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // ============ HERO METRIC ============
  heroCard: {
    marginBottom: s.md,
    ...shadows.sm,
  },
  heroEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  heroValue: {
    color: colors.primary,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -1,
    marginTop: 4,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    marginTop: s.sm,
    flexWrap: 'wrap',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  // ============ STATS GRID ============
  statsGrid: {
    flexDirection: 'row',
    gap: s.sm,
    marginBottom: s.xl,
  },
  statCard: {
    flex: 1,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statIconPrimary: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.25)',
  },
  statIconInfo: {
    backgroundColor: 'rgba(46,144,250,0.12)',
    borderColor: 'rgba(46,144,250,0.32)',
  },
  statValue: {
    color: colors.primary,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: s.sm,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 2,
  },

  // ============ ALL CLEAR ============
  allClearCard: {
    alignItems: 'center',
  },
  allClearHalo: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(31,174,111,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.sm,
  },
  allClearTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  allClearSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    textAlign: 'center',
  },

  // ============ ORDER CARD ============
  orderCard: {
    marginBottom: s.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  orderNumber: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  orderCustomer: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: s.xs,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
  },
  newDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  newBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
  orderMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s.sm,
  },
  orderMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  orderTotal: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: 0.2,
  },
  orderActions: {
    flexDirection: 'row',
    gap: s.sm,
    marginTop: s.md,
  },
  orderActionItem: { flex: 1 },

  // ============ ACTIONS GRID ============
  actionsGrid: {
    flexDirection: 'row',
    gap: s.sm,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.xs,
  },
  actionText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
