// ==========================================
// DEVOLÓN — Historial de entregas
//
// Header con eyebrow + stats grid (entregas, rating, tiempo, km).
// Lista de cards glass con ruta restaurante→cliente, ganancia hero
// y meta (distancia, duración, propina).
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { driverApi } from '../../services/api';
import { Card, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface Delivery {
  id: string;
  orderNumber: string;
  restaurantName: string;
  customerName: string;
  customerAddress: string;
  earnings: number;
  tip: number;
  distance: number;
  duration: number;
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
        setDeliveries((prev) => [...prev, ...data]);
      }
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await driverApi.getStats();
      // Guardamos contra null/undefined del backend.
      setStats({
        totalDeliveries: data?.totalDeliveries ?? 0,
        avgRating: data?.avgRating ?? 0,
        avgTime: data?.avgTime ?? 0,
        totalDistance: data?.totalDistance ?? 0,
      });
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

  // Bulletproof: maneja todo (string/number/undefined/null/NaN/objetos).
  const formatCurrency = (amount: any) => {
    const n = Number(amount);
    return `$${(isFinite(n) ? n : 0).toFixed(2)}`;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return (
        'Hoy ' +
        d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      );
    } else if (d.toDateString() === yesterday.toDateString()) {
      return (
        'Ayer ' +
        d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      );
    }
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper bulletproof — convierte cualquier basura a número finito o 0.
  const num = (v: any) => {
    const n = Number(v);
    return isFinite(n) ? n : 0;
  };

  const renderDelivery = ({ item }: { item: any }) => {
    const safe = item || {};
    const earnings = num(safe.earnings);
    const tip = num(safe.tip);
    const distance = num(safe.distance);
    const duration = safe.duration ?? '—';
    const rating = safe.rating;
    return (
      <Card variant="glass" padding={s.lg} borderRadius={radius.xl} style={styles.deliveryCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderEyebrow}>DVL-{String(safe.orderNumber ?? '—')}</Text>
            <Text style={styles.orderDate}>
              {safe.completedAt ? formatDate(safe.completedAt) : ''}
            </Text>
          </View>
          <View style={styles.earnBlock}>
            <Text style={styles.earnValue}>{formatCurrency(earnings + tip)}</Text>
            {rating != null && typeof rating !== 'object' && (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={11} color={colors.primary} />
                <Text style={styles.ratingText}>{String(rating)}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.route}>
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.routeDotPickup]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>RECOGER</Text>
              <Text style={styles.routeName} numberOfLines={1}>
                {String(safe.restaurantName ?? safe.restaurant?.name ?? 'Restaurante')}
              </Text>
            </View>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.routeDot, styles.routeDotDrop]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.routeLabel}>ENTREGAR</Text>
              <Text style={styles.routeName} numberOfLines={1}>
                {String(safe.customerName ?? safe.customer?.name ?? 'Cliente')}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Ionicons name="navigate-outline" size={12} color={colors.textMuted} />
            <Text style={styles.statPillText}>{distance.toFixed(1)} km</Text>
          </View>
          <View style={styles.statPill}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.statPillText}>{String(duration)} min</Text>
          </View>
          {tip > 0 && (
            <View style={[styles.statPill, styles.statPillTip]}>
              <Ionicons name="heart" size={12} color={colors.success} />
              <Text style={[styles.statPillText, styles.statPillTextTip]}>
                +{formatCurrency(tip)} propina
              </Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>HISTORIAL</Text>
        <Text style={styles.headerTitle}>Mis entregas</Text>
      </View>

      {/* STATS GRID — todo guardado contra null/undefined/strings */}
      <View style={styles.statsGrid}>
        <Card variant="raised" padding={s.md} borderRadius={radius.xl} style={styles.statCard}>
          <Ionicons name="bicycle" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{num(stats?.totalDeliveries)}</Text>
          <Text style={styles.statLabel}>ENTREGAS</Text>
        </Card>
        <Card variant="glass" padding={s.md} borderRadius={radius.xl} style={styles.statCard}>
          <Ionicons name="star" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{num(stats?.avgRating).toFixed(1)}</Text>
          <Text style={styles.statLabel}>RATING</Text>
        </Card>
        <Card variant="glass" padding={s.md} borderRadius={radius.xl} style={styles.statCard}>
          <Ionicons name="time-outline" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{num(stats?.avgTime)}</Text>
          <Text style={styles.statLabel}>MIN PROM</Text>
        </Card>
        <Card variant="glass" padding={s.md} borderRadius={radius.xl} style={styles.statCard}>
          <Ionicons name="map-outline" size={16} color={colors.primary} />
          <Text style={styles.statValue}>{num(stats?.totalDistance).toFixed(0)}</Text>
          <Text style={styles.statLabel}>KM TOTAL</Text>
        </Card>
      </View>

      {/* LIST */}
      <FlatList
        data={deliveries}
        renderItem={renderDelivery}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          deliveries.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={styles.listEyebrow}>RECIENTES</Text>
              <Text style={styles.listTitle}>Últimas entregas</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            icon="bicycle-outline"
            title="Aún no hay entregas"
            subtitle="Cuando completes una entrega aparecerá aquí."
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

  // ============ STATS GRID ============
  statsGrid: {
    flexDirection: 'row',
    gap: s.xs,
    paddingHorizontal: s.xl,
    marginBottom: s.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
    flexGrow: 1,
  },
  listHeader: {
    marginBottom: s.md,
  },
  listEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  listTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
  },

  // ============ DELIVERY CARD ============
  deliveryCard: {
    marginBottom: s.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  orderEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  orderDate: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  earnBlock: {
    alignItems: 'flex-end',
  },
  earnValue: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    marginTop: 4,
  },
  ratingText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
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
  },
  routeName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 1,
  },
  routeLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
    marginLeft: 18,
  },

  // ============ STATS PILLS ============
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
    marginTop: s.sm,
  },
  statPill: {
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
  statPillTip: {
    backgroundColor: 'rgba(31,174,111,0.1)',
    borderColor: 'rgba(31,174,111,0.32)',
  },
  statPillText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  statPillTextTip: { color: colors.success },
});
