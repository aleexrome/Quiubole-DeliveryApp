// ==========================================
// DEVOLÓN — Ganancias
//
// Period selector pill (hoy/semana/mes), hero card raised con número
// hero amarillo + entregas/promedio, desglose (tarifas/propinas/bonos)
// con barras de progreso, payout card con CTA, historial reciente
// y tips para ganar más.
//
// IMPORTANTE: render del historial usa .map() inline (NO FlatList) —
// la versión vieja con FlatList + renderHistoryItem era la que
// crasheaba con `Cannot read property 'toFixed' of undefined`.
// Toda lectura numérica pasa por `num()` o `formatCurrency()`, ambos
// blindados con `isFinite()`.
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
import { driverApi } from '../../services/api';
import { Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type Period = 'day' | 'week' | 'month';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Hoy',
  week: 'Semana',
  month: 'Mes',
};

export default function DriverEarningsScreen() {
  const [period, setPeriod] = useState<Period>('week');
  const [earnings, setEarnings] = useState({
    total: 0,
    deliveryFees: 0,
    tips: 0,
    bonus: 0,
    deliveries: 0,
    avgPerDelivery: 0,
    pendingPayout: 0,
  });
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    loadEarnings();
    loadHistory();
  }, [period]);

  const loadEarnings = async () => {
    try {
      const raw: any = await driverApi.getEarnings(period);
      // Backend devuelve { totalOrders, totalEarnings, orders[] }.
      // Mapeamos a la shape rica calculando breakdowns desde orders[].
      const orders: any[] = Array.isArray(raw?.orders) ? raw.orders : [];
      const deliveryFees = orders.reduce(
        (sum, o) => sum + num(o?.deliveryFee),
        0,
      );
      const tips = orders.reduce((sum, o) => sum + num(o?.tip), 0);
      const total = num(raw?.totalEarnings) || deliveryFees + tips;
      const deliveries = num(raw?.totalOrders) || orders.length || 0;
      setEarnings({
        total,
        deliveryFees,
        tips,
        bonus: 0, // backend no expone bonus aún
        deliveries,
        avgPerDelivery: deliveries > 0 ? total / deliveries : 0,
        pendingPayout: num(raw?.pendingPayout),
      });
    } catch (error) {
      console.error('Error loading earnings:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await driverApi.getDeliveryHistory(1);
      const arr = Array.isArray(data)
        ? data
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];
      setHistory(arr);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  // Bulletproof: maneja string/number/undefined/null/NaN/objetos/arrays.
  const num = (v: any, fallback = 0) => {
    const n = Number(v);
    return isFinite(n) ? n : fallback;
  };

  const formatCurrency = (amount: any) => {
    const n = Number(amount);
    return `$${(isFinite(n) ? n : 0).toFixed(2)}`;
  };

  const formatDate = (date: any) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const pct = (part: number, total: number) =>
    total > 0 ? Math.min(100, Math.round((part / total) * 100)) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>BILLETERA</Text>
          <Text style={styles.headerTitle}>Ganancias</Text>
        </View>

        {/* PERIOD SELECTOR */}
        <View style={styles.periodRow}>
          {(['day', 'week', 'month'] as Period[]).map((p) => {
            const active = period === p;
            return (
              <TouchableOpacity
                key={p}
                activeOpacity={0.85}
                onPress={() => setPeriod(p)}
                style={[styles.periodBtn, active && styles.periodBtnActive]}
              >
                <Text
                  style={[styles.periodText, active && styles.periodTextActive]}
                >
                  {PERIOD_LABELS[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* MAIN HERO CARD */}
        <Card
          variant="raised"
          padding={s.xl}
          borderRadius={radius['2xl']}
          style={styles.heroCard}
        >
          <Text style={styles.heroEyebrow}>
            TOTAL · {PERIOD_LABELS[period].toUpperCase()}
          </Text>
          <Text style={styles.heroValue}>{formatCurrency(earnings.total)}</Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{earnings.deliveries}</Text>
              <Text style={styles.heroStatLabel}>ENTREGAS</Text>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>
                {formatCurrency(earnings.avgPerDelivery)}
              </Text>
              <Text style={styles.heroStatLabel}>PROMEDIO</Text>
            </View>
          </View>
        </Card>

        {/* BREAKDOWN */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>DESGLOSE</Text>
          <Text style={styles.sectionTitle}>De dónde vienen</Text>

          <Card variant="glass" padding={s.lg} borderRadius={radius.xl}>
            <BreakdownRow
              label="Tarifas de entrega"
              value={formatCurrency(earnings.deliveryFees)}
              tint={colors.primary}
              percent={pct(earnings.deliveryFees, earnings.total)}
            />
            <BreakdownRow
              label="Propinas"
              value={formatCurrency(earnings.tips)}
              tint={colors.success}
              percent={pct(earnings.tips, earnings.total)}
            />
            <BreakdownRow
              label="Bonos"
              value={formatCurrency(earnings.bonus)}
              tint={colors.info}
              percent={pct(earnings.bonus, earnings.total)}
              isLast
            />
          </Card>
        </View>

        {/* PRÓXIMO PAGO — informativo, no acción.
            Devolón deposita automáticamente cada semana (lunes) a la
            cuenta bancaria registrada del repartidor. El driver NO
            retira manualmente; solo consulta cuándo le toca cobrar. */}
        <View style={styles.sectionWrap}>
          <Card
            variant="glass"
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.payoutCard}
          >
            <View style={styles.payoutLeft}>
              <View style={styles.payoutIcon}>
                <Ionicons name="wallet" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payoutEyebrow}>PRÓXIMO DEPÓSITO</Text>
                <Text style={styles.payoutValue}>
                  {formatCurrency(earnings.pendingPayout)}
                </Text>
                <Text style={styles.payoutHint}>
                  Se deposita el próximo lunes a tu cuenta registrada.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* HISTORY — render con .map() inline (NO FlatList) */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>HISTORIAL</Text>
          <Text style={styles.sectionTitle}>Entregas recientes</Text>

          {history.length === 0 ? (
            <Card
              variant="glass"
              padding={s.xl}
              borderRadius={radius.xl}
              style={styles.emptyHistory}
            >
              <View style={styles.emptyHalo}>
                <Ionicons
                  name="bicycle-outline"
                  size={28}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>Sin entregas aún</Text>
              <Text style={styles.emptySubtitle}>
                Tu historial aparecerá aquí cuando completes pedidos.
              </Text>
            </Card>
          ) : (
            <View>
              {history.slice(0, 5).map((it: any, idx: number) => {
                const safe = it || {};
                const restaurantName =
                  safe.restaurantName ||
                  safe.restaurant?.name ||
                  'Restaurante';
                const orderNum = String(safe.orderNumber ?? '—');
                const tip = num(safe.tip);
                const distance = num(safe.distance);
                const earn = num(
                  safe.earnings ?? safe.deliveryFee ?? safe.total,
                );
                const completedAt =
                  safe.completedAt || safe.deliveredAt || safe.createdAt;
                return (
                  <Card
                    key={safe.id ?? idx}
                    variant="glass"
                    padding={s.md}
                    borderRadius={radius.lg}
                    style={[styles.historyItem, { marginBottom: s.xs }]}
                  >
                    <View style={styles.historyIcon}>
                      <Ionicons name="bicycle" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text
                        style={styles.historyRestaurant}
                        numberOfLines={1}
                      >
                        {String(restaurantName)}
                      </Text>
                      <Text style={styles.historyDetails}>
                        DVL-{orderNum}
                        {distance > 0 ? ` · ${distance.toFixed(1)} km` : ''}
                      </Text>
                      {completedAt ? (
                        <Text style={styles.historyDate}>
                          {formatDate(completedAt)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.historyEarnings}>
                      <Text style={styles.historyTotal}>
                        {formatCurrency(earn + tip)}
                      </Text>
                      {tip > 0 ? (
                        <Text style={styles.historyTip}>
                          +{formatCurrency(tip)}
                        </Text>
                      ) : null}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </View>

        {/* TIPS */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>CONSEJOS</Text>
          <Text style={styles.sectionTitle}>Gana más</Text>

          <Card
            variant="glass"
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.tipCard}
          >
            <View style={styles.tipIcon}>
              <Ionicons name="flame" size={22} color={colors.primary} />
            </View>
            <View style={styles.tipBody}>
              <Text style={styles.tipTitle}>Horas pico</Text>
              <Text style={styles.tipText}>
                12:00-14:00 y 19:00-21:00 son los horarios con más demanda.
              </Text>
            </View>
          </Card>

          <Card
            variant="glass"
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.tipCard}
          >
            <View style={styles.tipIcon}>
              <Ionicons name="star" size={22} color={colors.primary} />
            </View>
            <View style={styles.tipBody}>
              <Text style={styles.tipTitle}>Mejor rating, mejores propinas</Text>
              <Text style={styles.tipText}>
                Entrega rápido y con buena actitud para recibir propinas más
                altas.
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ BREAKDOWN ROW ============
function BreakdownRow({
  label,
  value,
  tint,
  percent,
  isLast,
}: {
  label: string;
  value: string;
  tint: string;
  percent: number;
  isLast?: boolean;
}) {
  return (
    <View style={[breakdown.row, !isLast && breakdown.rowBorder]}>
      <View style={breakdown.head}>
        <View style={breakdown.headLeft}>
          <View style={[breakdown.dot, { backgroundColor: tint }]} />
          <Text style={breakdown.label}>{label}</Text>
        </View>
        <Text style={breakdown.value}>{value}</Text>
      </View>
      <View style={breakdown.barTrack}>
        <View
          style={[
            breakdown.barFill,
            { width: `${percent}%`, backgroundColor: tint },
          ]}
        />
      </View>
    </View>
  );
}

const breakdown = StyleSheet.create({
  row: { paddingVertical: s.sm },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  value: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginTop: s.xs,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // HEADER
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

  // PERIOD SELECTOR
  periodRow: {
    flexDirection: 'row',
    gap: s.xs,
    paddingHorizontal: s.xl,
    marginBottom: s.lg,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: s.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  periodTextActive: { color: colors.onPrimary },

  // HERO CARD
  heroCard: { marginHorizontal: s.xl, alignItems: 'center' },
  heroEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  heroValue: {
    color: colors.primary,
    fontSize: fontSize.hero,
    fontWeight: fontWeight.black,
    letterSpacing: -2,
    marginTop: s.xs,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: s.lg,
    width: '100%',
    paddingTop: s.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatDivider: { width: 1, backgroundColor: colors.border },
  heroStatValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  heroStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 4,
  },

  // SECTIONS
  sectionWrap: { paddingHorizontal: s.xl, marginTop: s['2xl'] },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: s.md,
  },

  // PAYOUT
  payoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    flex: 1,
  },
  payoutIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payoutEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  payoutValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  payoutHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 4,
    lineHeight: 16,
  },

  // HISTORY ITEM
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: { flex: 1 },
  historyRestaurant: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  historyDetails: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  historyDate: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  historyEarnings: { alignItems: 'flex-end' },
  historyTotal: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  historyTip: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    marginTop: 2,
  },

  // EMPTY HISTORY
  emptyHistory: { alignItems: 'center' },
  emptyHalo: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xs,
    paddingHorizontal: s.md,
    lineHeight: 18,
  },

  // TIPS
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.xs,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipBody: { flex: 1 },
  tipTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 18,
  },
});
