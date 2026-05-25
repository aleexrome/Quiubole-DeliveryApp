// ==========================================
// DEVOLÓN — Restaurant Stats
// Métricas históricas: período seleccionable, hero de ventas, secundarias,
// gráfica de barras y top de productos vendidos.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { restaurantsApi } from '../../services/api';
import { Card, Section } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
  shadows,
} from '../../theme';

type Period = 'day' | 'week' | 'month';

export default function RestaurantStatsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    topProducts: [] as { name: string; quantity: number; revenue: number }[],
    revenueByDay: [] as { day: string; revenue: number }[],
  });

  useEffect(() => {
    loadStats();
  }, [period]);

  const loadStats = async () => {
    try {
      // El backend devuelve { orders, revenue, rating, totalReviews, period }.
      // El frontend espera un schema más rico (topProducts, revenueByDay,
      // completedOrders, etc.) que aún no está implementado en backend.
      // Mapeamos los campos disponibles y mergeamos con el initial state
      // para garantizar que los arrays existan — evita crash de
      // `revenueByDay.length` cuando llega undefined.
      const raw: any = await restaurantsApi.getStats(period);
      setStats((prev) => ({
        ...prev,
        totalOrders: raw?.orders ?? raw?.totalOrders ?? 0,
        totalRevenue: parseFloat(raw?.revenue ?? raw?.totalRevenue ?? 0),
        averageOrderValue:
          raw?.averageOrderValue ??
          (raw?.orders > 0
            ? parseFloat(raw?.revenue || 0) / raw.orders
            : 0),
        completedOrders: raw?.completedOrders ?? raw?.orders ?? 0,
        cancelledOrders: raw?.cancelledOrders ?? 0,
        topProducts: Array.isArray(raw?.topProducts) ? raw.topProducts : [],
        revenueByDay: Array.isArray(raw?.revenueByDay) ? raw.revenueByDay : [],
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(n ?? 0).toFixed(2)}`;
  };

  const getMaxRevenue = () => {
    // Defensive: arrays opcionales del backend pueden no venir.
    if (!stats.revenueByDay || !stats.revenueByDay.length) return 1;
    return Math.max(...stats.revenueByDay.map((d) => d.revenue));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        {/* ============ HEADER ============ */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>DEVOLÓN · MÉTRICAS</Text>
          <Text style={styles.title}>Estadísticas</Text>
        </View>

        {/* ============ PERIOD SELECTOR ============ */}
        <View style={styles.periodSelector}>
          {(['day', 'week', 'month'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.periodTextActive,
                ]}
              >
                {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : 'Mes'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.body}>
          {/* ============ HERO STAT ============ */}
          <Card
            variant="raised"
            padding={s.xl}
            borderRadius={radius['2xl']}
            style={styles.heroCard}
          >
            <Text style={styles.heroEyebrow}>VENTAS TOTALES</Text>
            <Text style={styles.heroValue}>
              {formatCurrency(stats.totalRevenue)}
            </Text>
            <View style={styles.heroMeta}>
              <Ionicons name="receipt-outline" size={13} color={colors.textMuted} />
              <Text style={styles.heroMetaText}>
                {stats.totalOrders} pedido{stats.totalOrders === 1 ? '' : 's'} ·{' '}
                {formatCurrency(stats.averageOrderValue)} ticket promedio
              </Text>
            </View>
          </Card>

          {/* ============ SECONDARY STATS ============ */}
          <View style={styles.secondaryStats}>
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.xl}
              style={styles.secondaryCard}
            >
              <View style={[styles.secondaryIcon, styles.iconSuccess]}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              </View>
              <Text style={styles.secondaryValue}>{stats.completedOrders}</Text>
              <Text style={styles.secondaryLabel}>COMPLETADOS</Text>
            </Card>
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.xl}
              style={styles.secondaryCard}
            >
              <View style={[styles.secondaryIcon, styles.iconDanger]}>
                <Ionicons name="close-circle" size={14} color={colors.danger} />
              </View>
              <Text style={styles.secondaryValue}>{stats.cancelledOrders}</Text>
              <Text style={styles.secondaryLabel}>CANCELADOS</Text>
            </Card>
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.xl}
              style={styles.secondaryCard}
            >
              <View style={[styles.secondaryIcon, styles.iconPrimary]}>
                <Ionicons name="trending-up" size={14} color={colors.primary} />
              </View>
              <Text style={styles.secondaryValue}>
                {stats.totalOrders > 0
                  ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}%`
                  : '0%'}
              </Text>
              <Text style={styles.secondaryLabel}>ÉXITO</Text>
            </Card>
          </View>

          {/* ============ REVENUE CHART ============ */}
          <Section title="Ventas por día" eyebrow="TENDENCIA" spacing={s.xl}>
            <Card variant="glass" padding={s.lg} borderRadius={radius.xl}>
              {!stats.revenueByDay || stats.revenueByDay.length === 0 ? (
                <View style={styles.emptyChart}>
                  <Ionicons
                    name="bar-chart-outline"
                    size={32}
                    color={colors.textFaint}
                  />
                  <Text style={styles.emptyChartText}>
                    Sin datos disponibles
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.chartContainer}>
                    {stats.revenueByDay.map((day, index) => {
                      const heightPct = (day.revenue / getMaxRevenue()) * 100;
                      const isPeak = day.revenue === getMaxRevenue() && day.revenue > 0;
                      return (
                        <View key={index} style={styles.chartBar}>
                          <View style={styles.barContainer}>
                            <View
                              style={[
                                styles.bar,
                                {
                                  height: `${heightPct}%`,
                                  backgroundColor: isPeak
                                    ? colors.primary
                                    : 'rgba(255,194,14,0.35)',
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.barLabel}>{day.day}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <View style={styles.chartLegend}>
                    <Text style={styles.chartLegendText}>
                      Pico:{' '}
                      <Text style={styles.chartLegendValue}>
                        {formatCurrency(getMaxRevenue())}
                      </Text>
                    </Text>
                  </View>
                </>
              )}
            </Card>
          </Section>

          {/* ============ TOP PRODUCTS ============ */}
          <Section title="Productos top" eyebrow="MÁS VENDIDOS" spacing={s.xl}>
            <Card variant="glass" padding={0} borderRadius={radius.xl}>
              {!stats.topProducts || stats.topProducts.length === 0 ? (
                <View style={styles.emptyProducts}>
                  <Ionicons
                    name="trophy-outline"
                    size={28}
                    color={colors.textFaint}
                  />
                  <Text style={styles.emptyChartText}>
                    Sin datos disponibles
                  </Text>
                </View>
              ) : (
                stats.topProducts.map((product, index) => (
                  <View key={index}>
                    {index > 0 && <View style={styles.productDivider} />}
                    <View style={styles.productRow}>
                      <View
                        style={[
                          styles.productRank,
                          index === 0 && styles.productRankFirst,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rankText,
                            index === 0 && styles.rankTextFirst,
                          ]}
                        >
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.productInfo}>
                        <Text style={styles.productName} numberOfLines={1}>
                          {product.name}
                        </Text>
                        <Text style={styles.productQuantity}>
                          {product.quantity} vendido{product.quantity === 1 ? '' : 's'}
                        </Text>
                      </View>
                      <Text style={styles.productRevenue}>
                        {formatCurrency(product.revenue)}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </Card>
          </Section>

          {/* ============ TIPS ============ */}
          <Section title="Tips para crecer" eyebrow="INSIGHTS" spacing={s.lg}>
            <Card
              variant="glass"
              padding={s.lg}
              borderRadius={radius.xl}
              style={styles.tipCard}
            >
              <View style={styles.tipHalo}>
                <Ionicons name="bulb-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Amplía tu catálogo</Text>
                <Text style={styles.tipText}>
                  Los restaurantes con más variedad reciben 30% más pedidos.
                </Text>
              </View>
            </Card>
            <Card
              variant="glass"
              padding={s.lg}
              borderRadius={radius.xl}
              style={styles.tipCard}
            >
              <View style={styles.tipHalo}>
                <Ionicons name="camera-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Mejora tus fotos</Text>
                <Text style={styles.tipText}>
                  Productos con buenas fotos se venden 2× más.
                </Text>
              </View>
            </Card>
            <Card
              variant="glass"
              padding={s.lg}
              borderRadius={radius.xl}
              style={styles.tipCard}
            >
              <View style={styles.tipHalo}>
                <Ionicons name="flash-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Responde rápido</Text>
                <Text style={styles.tipText}>
                  Acepta pedidos en menos de 2 minutos para subir en ranking.
                </Text>
              </View>
            </Card>
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
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },

  // ============ PERIOD SELECTOR ============
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: s.xl,
    paddingBottom: s.md,
    gap: s.xs,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: s.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  periodText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  periodTextActive: {
    color: colors.primary,
  },

  // ============ BODY ============
  body: {
    paddingHorizontal: s.xl,
  },

  // ============ HERO CARD ============
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
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: s.sm,
  },
  heroMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },

  // ============ SECONDARY STATS ============
  secondaryStats: {
    flexDirection: 'row',
    gap: s.xs,
    marginBottom: s.xl,
  },
  secondaryCard: { flex: 1 },
  secondaryIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconSuccess: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderColor: 'rgba(31,174,111,0.32)',
  },
  iconDanger: {
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderColor: 'rgba(229,72,77,0.32)',
  },
  iconPrimary: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.25)',
  },
  secondaryValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
    marginTop: s.xs,
  },
  secondaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 2,
  },

  // ============ CHART ============
  chartContainer: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  barContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: radius.sm,
    minHeight: 4,
  },
  barLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    marginTop: s.xs,
    textTransform: 'uppercase',
  },
  chartLegend: {
    marginTop: s.md,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chartLegendText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  chartLegendValue: {
    color: colors.primary,
    fontWeight: fontWeight.black,
  },
  emptyChart: {
    paddingVertical: s.xl,
    alignItems: 'center',
    gap: s.sm,
  },
  emptyChartText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  // ============ TOP PRODUCTS ============
  emptyProducts: {
    paddingVertical: s.xl,
    alignItems: 'center',
    gap: s.sm,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.md,
    paddingHorizontal: s.lg,
    gap: s.sm,
  },
  productDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: s.lg,
  },
  productRank: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productRankFirst: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rankText: {
    color: colors.textMuted,
    fontWeight: fontWeight.black,
    fontSize: fontSize.xs,
  },
  rankTextFirst: {
    color: colors.onPrimary,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  productQuantity: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  productRevenue: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: 0.2,
  },

  // ============ TIPS ============
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.sm,
  },
  tipHalo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipContent: { flex: 1 },
  tipTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 16,
  },
});
