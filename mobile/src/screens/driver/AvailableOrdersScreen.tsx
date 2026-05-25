// ==========================================
// DEVOLÓN — Pedidos disponibles
//
// Lista filtrable de órdenes para tomar. Cards glass con stat de
// ganancia hero (amarillo black), meta pills de distancia/tiempo/items
// y CTA "Aceptar" con glow. Mock + endpoint real cuando exista.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ordersApi } from '../../services/api';
import { Order } from '../../types';
import { Card, Header, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type SortKey = 'earnings' | 'distance' | 'time';

const SORTS: { key: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'earnings', label: 'Mejor pago', icon: 'cash-outline' },
  { key: 'distance', label: 'Más cercano', icon: 'navigate-outline' },
  { key: 'time', label: 'Más rápido', icon: 'time-outline' },
];

export default function AvailableOrdersScreen() {
  const navigation = useNavigation<any>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState<SortKey>('earnings');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getAvailableOrders(0, 0, 5);
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading available orders:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAccept = async (order: Order) => {
    try {
      await ordersApi.acceptDelivery(order.id);
      navigation.navigate('ActiveDelivery', { orderId: order.id });
    } catch (error) {
      Alert.alert('Error', 'No se pudo aceptar el pedido. Intenta otro.');
      loadOrders();
    }
  };

  const formatCurrency = (amount: any) => {
    const n = Number(amount);
    return `$${(isFinite(n) ? n : 0).toFixed(2)}`;
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const earn = item.deliveryFee + (item.tip || 0);
    return (
      <Card variant="glass" padding={s.lg} borderRadius={radius.xl} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.restaurantBlock}>
            <View style={styles.iconHalo}>
              <Ionicons name="restaurant" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.restaurantName} numberOfLines={1}>
                {item.restaurant?.name || 'Restaurante'}
              </Text>
              <Text style={styles.orderRef}>DVL-{item.orderNumber}</Text>
            </View>
          </View>
          <View style={styles.earnBlock}>
            <Text style={styles.earnEyebrow}>GANAS</Text>
            <Text style={styles.earnValue}>{formatCurrency(earn)}</Text>
            {(item.tip || 0) > 0 && (
              <Text style={styles.tipNote}>
                +{formatCurrency(item.tip || 0)} propina
              </Text>
            )}
          </View>
        </View>

        {/* RUTA */}
        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.routeDotPickup]} />
            <Text style={styles.routeLabel}>RECOGER</Text>
            <Text style={styles.routeText} numberOfLines={1}>
              {item.restaurant?.address?.street || '—'}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.routeDotDrop]} />
            <Text style={styles.routeLabel}>ENTREGAR</Text>
            <Text style={styles.routeText} numberOfLines={1}>
              {item.deliveryAddress?.street || '—'}
            </Text>
          </View>
        </View>

        {/* META */}
        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>2.5 km</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>~15 min</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="bag-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>{item.items?.length || 0} items</Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => handleAccept(item)}
          style={styles.acceptBtn}
        >
          <Ionicons name="checkmark-circle" size={18} color={colors.onPrimary} />
          <Text style={styles.acceptBtnText}>ACEPTAR PEDIDO</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header eyebrow="DISPONIBLES" title="Pedidos cerca" />

      {/* SORT PILLS */}
      <View style={styles.sortWrap}>
        {SORTS.map((opt) => {
          const active = sort === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.85}
              onPress={() => setSort(opt.key)}
              style={[styles.sortPill, active && styles.sortPillActive]}
            >
              <Ionicons
                name={opt.icon}
                size={13}
                color={active ? colors.onPrimary : colors.textMuted}
              />
              <Text style={[styles.sortText, active && styles.sortTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={orders}
        keyExtractor={(i) => i.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title="Sin pedidos por ahora"
            subtitle="Te notificaremos cuando llegue un pedido cerca de ti."
            actionLabel="Actualizar"
            onAction={onRefresh}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ SORT ============
  sortWrap: {
    flexDirection: 'row',
    gap: s.xs,
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  sortPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: s.sm,
    paddingHorizontal: s.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  sortTextActive: { color: colors.onPrimary },

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
    flexGrow: 1,
  },

  // ============ CARD ============
  card: {
    marginBottom: s.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
  },
  restaurantBlock: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  orderRef: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 2,
  },
  earnBlock: {
    alignItems: 'flex-end',
  },
  earnEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  earnValue: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },
  tipNote: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.2,
    marginTop: 2,
  },

  // ============ ROUTE ============
  route: {
    marginTop: s.md,
    paddingVertical: s.sm,
    paddingHorizontal: s.sm,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  routeDotPickup: { backgroundColor: colors.primary },
  routeDotDrop: { backgroundColor: colors.success },
  routeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    width: 70,
  },
  routeText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  routeLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
    marginLeft: 18,
  },

  // ============ META ============
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
    marginTop: s.sm,
  },
  metaPill: {
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
  metaText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // ============ CTA ============
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: radius.lg,
    marginTop: s.md,
    ...shadows.glow,
  },
  acceptBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
});
