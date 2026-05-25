// ==========================================
// DEVOLÓN — Customer Orders (tab)
//
// Pedidos activos con barra de progreso amarilla + histórico abajo
// como cards glass. Status chips con acento semántico.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

type StatusConfig = { label: string; color: string; icon: keyof typeof Ionicons.glyphMap };

const STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: { label: 'Pendiente', color: colors.warning, icon: 'time-outline' },
  confirmed: { label: 'Confirmado', color: colors.info, icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparando', color: colors.info, icon: 'restaurant-outline' },
  ready_for_pickup: { label: 'Listo', color: colors.info, icon: 'bag-check-outline' },
  driver_assigned: { label: 'Repartidor asignado', color: colors.primary, icon: 'bicycle-outline' },
  picked_up: { label: 'Recogido', color: colors.primary, icon: 'navigate-outline' },
  on_the_way: { label: 'En camino', color: colors.primary, icon: 'navigate-outline' },
  delivered: { label: 'Entregado', color: colors.success, icon: 'checkmark-done-circle-outline' },
  cancelled: { label: 'Cancelado', color: colors.danger, icon: 'close-circle-outline' },
};

const MOCK_ACTIVE: Partial<Order>[] = [
  {
    id: '1',
    orderNumber: 'DVL-001235',
    status: 'preparing',
    total: 189,
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    restaurant: {
      id: '1',
      name: 'Tacos El Patrón',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    } as any,
    items: [{ id: '1', product: { name: 'Tacos al Pastor' } as any, quantity: 3 } as any],
  },
];

const MOCK_PAST: Partial<Order>[] = [
  {
    id: '2',
    orderNumber: 'DVL-001234',
    status: 'delivered',
    total: 245.5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    restaurant: {
      id: '1',
      name: 'Tacos El Patrón',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    } as any,
    items: [{ id: '1', product: { name: 'Tacos al Pastor' } as any, quantity: 3 } as any],
  },
  {
    id: '3',
    orderNumber: 'DVL-001230',
    status: 'delivered',
    total: 320,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    restaurant: {
      id: '2',
      name: 'Pizza Napoli',
      logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    } as any,
    items: [{ id: '1', product: { name: 'Pizza Margherita' } as any, quantity: 1 } as any],
  },
];

const formatDate = (date: Date) => {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `Hace ${mins} min`;
  if (hrs < 24) return `Hace ${hrs}h`;
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-MX');
};

const progressFor = (status: OrderStatus): number => {
  const map: Record<OrderStatus, number> = {
    pending: 10,
    confirmed: 25,
    preparing: 40,
    ready_for_pickup: 55,
    driver_assigned: 65,
    picked_up: 75,
    on_the_way: 90,
    delivered: 100,
    cancelled: 0,
  };
  return map[status] ?? 0;
};

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const [activeOrders] = useState<Partial<Order>[]>(MOCK_ACTIVE);
  const [pastOrders] = useState<Partial<Order>[]>(MOCK_PAST);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  const handleOrderPress = (order: Partial<Order>) => {
    const isActive = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'driver_assigned', 'picked_up', 'on_the_way'].includes(order.status!);
    if (isActive) navigation.navigate('OrderTracking', { orderId: order.id });
    else navigation.navigate('OrderHistory');
  };

  const renderActive = (order: Partial<Order>) => {
    const sc = STATUS_CONFIG[order.status as OrderStatus];
    const progress = progressFor(order.status as OrderStatus);
    return (
      <Card
        key={order.id}
        variant="glass"
        onPress={() => handleOrderPress(order)}
        padding={s.lg}
        borderRadius={radius.xl}
        style={styles.activeCard}
      >
        <View style={styles.activeRow}>
          <Image source={{ uri: order.restaurant?.logo }} style={styles.activeLogo} />
          <View style={styles.activeBody}>
            <Text style={styles.activeRestaurant}>{order.restaurant?.name}</Text>
            <View style={styles.statusChipRow}>
              <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
              <Text style={[styles.statusText, { color: sc.color }]}>
                {sc.label}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.trackBtn} activeOpacity={0.85}>
            <Ionicons name="navigate" size={14} color={colors.onPrimary} />
            <Text style={styles.trackBtnText}>RASTREAR</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Pedido</Text>
            <Text style={styles.progressLabel}>Preparando</Text>
            <Text style={styles.progressLabel}>En camino</Text>
            <Text style={styles.progressLabel}>Entregado</Text>
          </View>
        </View>
      </Card>
    );
  };

  const renderPast = ({ item }: { item: Partial<Order> }) => (
    <Card
      variant="glass"
      onPress={() => handleOrderPress(item)}
      padding={s.md}
      borderRadius={radius.lg}
      style={styles.pastCard}
    >
      <Image source={{ uri: item.restaurant?.logo }} style={styles.pastLogo} />
      <View style={styles.pastBody}>
        <Text style={styles.pastName}>{item.restaurant?.name}</Text>
        <Text style={styles.pastItems} numberOfLines={1}>
          {item.items?.map((i) => `${i.quantity}× ${i.product.name}`).join(', ')}
        </Text>
        <View style={styles.pastMetaRow}>
          <Text style={styles.pastDate}>{formatDate(item.createdAt!)}</Text>
          <Text style={styles.pastTotal}>${(Number(item.total) || 0).toFixed(2)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>HISTORIAL</Text>
        <Text style={styles.headerTitle}>Mis pedidos</Text>
      </View>

      <FlatList
        data={pastOrders}
        keyExtractor={(i) => i.id!}
        renderItem={renderPast}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingHorizontal: s.xl }}>
            {activeOrders.length > 0 && (
              <View style={{ marginBottom: s['2xl'] }}>
                <Text style={styles.sectionEyebrow}>EN CURSO</Text>
                <Text style={styles.sectionTitle}>Pedidos activos</Text>
                {activeOrders.map(renderActive)}
              </View>
            )}

            <View style={styles.pastHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>ARCHIVO</Text>
                <Text style={styles.sectionTitle}>Anteriores</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('OrderHistory')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.viewAll}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Sin pedidos"
            subtitle="Tus pedidos aparecerán aquí."
          />
        }
        contentContainerStyle={{
          paddingHorizontal: s.xl,
          paddingBottom: s['4xl'],
        }}
        ItemSeparatorComponent={() => <View style={{ height: s.xs }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: s.md,
  },

  // ============ ACTIVE ============
  activeCard: {},
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  activeLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
  },
  activeBody: { flex: 1 },
  activeRestaurant: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  statusChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  statusText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },
  trackBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  progressWrap: { marginTop: s.md },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
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

  // ============ PAST HEADER ============
  pastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: s.md,
  },
  viewAll: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ PAST CARD ============
  pastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.xs,
  },
  pastLogo: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
  },
  pastBody: { flex: 1 },
  pastName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  pastItems: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  pastMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  pastDate: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  pastTotal: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: 0.2,
  },
});
