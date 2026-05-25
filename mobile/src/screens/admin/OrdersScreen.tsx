// ==========================================
// DEVOLÓN — Admin Orders
//
// Monitor de pedidos global. Filtros por status, stats inline arriba,
// y lista de pedidos con info compacta (restaurante, cliente, driver,
// hora, total). Cards glass dark.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { Card, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type StatusConfig = {
  label: string;
  color: string;
  bgRgba: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: 'Pendiente',
    color: colors.primary,
    bgRgba: 'rgba(255,194,14,0.12)',
  },
  confirmed: {
    label: 'Confirmado',
    color: colors.info,
    bgRgba: 'rgba(46,144,250,0.12)',
  },
  preparing: {
    label: 'Preparando',
    color: colors.info,
    bgRgba: 'rgba(46,144,250,0.12)',
  },
  ready_for_pickup: {
    label: 'Listo',
    color: colors.success,
    bgRgba: 'rgba(31,174,111,0.12)',
  },
  driver_assigned: {
    label: 'Repartidor asignado',
    color: colors.primary,
    bgRgba: 'rgba(255,194,14,0.12)',
  },
  picked_up: {
    label: 'Recogido',
    color: colors.primary,
    bgRgba: 'rgba(255,194,14,0.12)',
  },
  on_the_way: {
    label: 'En camino',
    color: colors.primary,
    bgRgba: 'rgba(255,194,14,0.12)',
  },
  delivered: {
    label: 'Entregado',
    color: colors.success,
    bgRgba: 'rgba(31,174,111,0.12)',
  },
  cancelled: {
    label: 'Cancelado',
    color: colors.danger,
    bgRgba: 'rgba(229,72,77,0.12)',
  },
};

type OrdersStats = {
  all: number;
  active: number;
  pending: number;
  confirmed: number;
  preparing: number;
  ready_for_pickup: number;
  driver_assigned: number;
  picked_up: number;
  on_the_way: number;
  delivered: number;
  cancelled: number;
};

const EMPTY_ORDERS_STATS: OrdersStats = {
  all: 0, active: 0, pending: 0, confirmed: 0, preparing: 0,
  ready_for_pickup: 0, driver_assigned: 0, picked_up: 0, on_the_way: 0,
  delivered: 0, cancelled: 0,
};

export default function AdminOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrdersStats>(EMPTY_ORDERS_STATS);
  const [statusFilter, setStatusFilter] = useState<
    OrderStatus | 'active' | 'all'
  >('active');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
    loadStats();
  }, [statusFilter]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      loadStats();
    }, [statusFilter]),
  );

  const loadOrders = async () => {
    try {
      const data = await adminApi.getOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setOrders(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getOrdersStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading orders stats:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), loadStats()]);
    setRefreshing(false);
  };

  // Postgres devuelve `numeric` como string vía TypeORM (ej. "122.00").
  // string.toFixed no existe → crash. Coerción explícita aquí cubre los
  // tres casos: number, string, undefined/null.
  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(n ?? 0).toFixed(2)}`;
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrder = ({ item: order }: { item: Order }) => {
    const sc = STATUS_CONFIG[order.status];
    return (
      <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View
            style={[styles.statusBadge, { backgroundColor: sc.bgRgba }]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: sc.color }]}
            />
            <Text style={[styles.statusText, { color: sc.color }]}>
              {sc.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="restaurant" size={14} color={colors.primary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {order.restaurant.name}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={14} color={colors.info} />
            <Text style={styles.detailText} numberOfLines={1}>
              {order.customer.name}
            </Text>
          </View>
          {order.driver && (
            <View style={styles.detailRow}>
              <Ionicons name="bicycle" size={14} color={colors.primary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {order.driver.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
          <Text style={styles.orderTotal}>{formatCurrency(order.total)}</Text>
        </View>
      </Card>
    );
  };

  const filters: { key: typeof statusFilter; label: string }[] = [
    { key: 'active', label: 'Activos' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'delivered', label: 'Entregados' },
    { key: 'cancelled', label: 'Cancelados' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>MONITOR</Text>
          <Text style={styles.title}>Pedidos</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleRefresh}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* KPIs grandes — números amarillos hero (consultan stats globales,
          no filtran por el pill activo) */}
      <View style={styles.statsWrap}>
        <Card
          variant="raised"
          padding={s.md}
          borderRadius={radius.lg}
          style={styles.statCard}
        >
          <Text style={styles.statLabel}>PENDIENTES</Text>
          <Text style={styles.statValue}>{stats.pending}</Text>
        </Card>
        <Card
          variant="raised"
          padding={s.md}
          borderRadius={radius.lg}
          style={styles.statCard}
        >
          <Text style={styles.statLabel}>PREPARANDO</Text>
          <Text style={styles.statValue}>{stats.preparing}</Text>
        </Card>
        <Card
          variant="raised"
          padding={s.md}
          borderRadius={radius.lg}
          style={styles.statCard}
        >
          <Text style={styles.statLabel}>EN CAMINO</Text>
          <Text style={styles.statValue}>{stats.on_the_way}</Text>
        </Card>
      </View>

      {/* FILTERS con badge de count */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
      >
        {filters.map((f) => {
          const active = statusFilter === f.key;
          // Mapeo filtro → stats key
          const count =
            f.key === 'all'
              ? stats.all
              : f.key === 'active'
                ? stats.active
                : (stats as any)[f.key] ?? 0;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.85}
              onPress={() => setStatusFilter(f.key)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}
              </Text>
              <View
                style={[styles.filterCount, active && styles.filterCountActive]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    active && styles.filterCountTextActive,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LIST */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: s.sm }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Sin pedidos"
            subtitle="No hay pedidos para este filtro."
          />
        }
      />
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
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ STATS ============
  statsWrap: {
    flexDirection: 'row',
    gap: s.xs,
    paddingHorizontal: s.xl,
    paddingBottom: s.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  statValue: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 4,
  },

  // ============ FILTERS ============
  filtersScroll: {
    flexGrow: 0,
  },
  filters: {
    paddingHorizontal: s.xl,
    paddingTop: 4,
    paddingBottom: s.md + 4,
    gap: s.xs,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.md,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  filterTextActive: { color: colors.primary },
  filterCount: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterCountText: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 0.2,
  },
  filterCountTextActive: { color: colors.onPrimary },

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: s.xs,
  },
  orderNumber: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  orderDetails: {
    marginTop: s.sm,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s.sm,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  orderTime: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  orderTotal: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: 0.2,
  },
});
