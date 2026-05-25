// ==========================================
// DEVOLÓN — Devo Cupones (filename legacy: QuiuPointsScreen)
//
// Wallet de cupones personales del cliente. Header con balance de
// puntos y barra de progreso hacia el próximo cupón (cada 100 pts).
// Lista de cupones en 2 tabs: Disponibles / Historial. Cada cupón
// muestra type (%, $, envío gratis), valor, expiración y código.
//
// El cliente NO canjea puntos por cupones aquí — el cupón aparece
// automáticamente cuando cruza 100 pts y el admin lo configura.
// ==========================================

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { devoCouponsApi } from '../../services/api';
import { Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const POINTS_PER_COUPON = 100;

interface UserCoupon {
  id: string;
  code: string;
  status: 'pending_admin' | 'active' | 'redeemed' | 'expired';
  type: 'percentage' | 'fixed' | 'free_delivery' | 'product_discount' | null;
  value: number | null;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  description: string | null;
  expiresAt: string | null;
  restaurantId: string | null;
  restaurant?: { name: string } | null;
  redeemedAt: string | null;
  createdAt: string;
}

type Tab = 'available' | 'history';

export default function DevoCuponsScreen() {
  const navigation = useNavigation<any>();
  const [points, setPoints] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [tab, setTab] = useState<Tab>('available');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await devoCouponsApi.getMy();
      setPoints(data.points || 0);
      setLifetime(data.lifetime || 0);
      setCoupons(Array.isArray(data.coupons) ? data.coupons : []);
    } catch (error) {
      console.error('Error loading devo coupons:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const progressInBucket = points % POINTS_PER_COUPON;
  const progressPercent = (progressInBucket / POINTS_PER_COUPON) * 100;
  const pointsToNext = POINTS_PER_COUPON - progressInBucket;

  const available = coupons.filter(
    (c) => c.status === 'active' || c.status === 'pending_admin',
  );
  const history = coupons.filter(
    (c) => c.status === 'redeemed' || c.status === 'expired',
  );

  const visibleCoupons = tab === 'available' ? available : history;

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
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>LEALTAD</Text>
            <Text style={styles.title}>Devo Cupones</Text>
          </View>
        </View>

        {/* HERO — balance de puntos + progreso */}
        <Card
          variant="raised"
          padding={s.xl}
          borderRadius={radius['2xl']}
          style={styles.hero}
        >
          <Text style={styles.heroEyebrow}>PUNTOS DEVO</Text>
          <Text style={styles.heroValue}>{points}</Text>
          {available.length === 0 || progressInBucket > 0 ? (
            <Text style={styles.heroSub}>
              Te {pointsToNext === 1 ? 'falta' : 'faltan'}{' '}
              <Text style={styles.heroSubStrong}>{pointsToNext}</Text>{' '}
              {pointsToNext === 1 ? 'punto' : 'puntos'} para tu próximo cupón
            </Text>
          ) : (
            <Text style={styles.heroSub}>
              ¡Tienes cupones disponibles para usar!
            </Text>
          )}

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>0</Text>
            <Text style={styles.progressLabel}>{POINTS_PER_COUPON} pts</Text>
          </View>

          <View style={styles.heroFooter}>
            <View style={styles.heroFooterItem}>
              <Ionicons name="cart" size={14} color={colors.primary} />
              <Text style={styles.heroFooterText}>
                +10 pts por cada pedido
              </Text>
            </View>
            <View style={styles.heroFooterItem}>
              <Ionicons name="gift" size={14} color={colors.primary} />
              <Text style={styles.heroFooterText}>
                Cupón nuevo cada 100 pts
              </Text>
            </View>
          </View>
        </Card>

        {/* TABS */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTab('available')}
            style={[styles.tab, tab === 'available' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'available' && styles.tabTextActive,
              ]}
            >
              Disponibles ({available.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setTab('history')}
            style={[styles.tab, tab === 'history' && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'history' && styles.tabTextActive,
              ]}
            >
              Historial ({history.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* COUPONS LIST */}
        <View style={styles.list}>
          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : visibleCoupons.length === 0 ? (
            <Card
              variant="glass"
              padding={s.xl}
              borderRadius={radius.xl}
              style={styles.empty}
            >
              <View style={styles.emptyHalo}>
                <Ionicons
                  name="gift-outline"
                  size={36}
                  color={colors.textMuted}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {tab === 'available'
                  ? 'Sin cupones por ahora'
                  : 'Sin historial'}
              </Text>
              <Text style={styles.emptySub}>
                {tab === 'available'
                  ? 'Cada 100 puntos recibes un cupón nuevo. ¡Sigue pidiendo!'
                  : 'Aquí aparecerán los cupones que ya usaste o expiraron.'}
              </Text>
            </Card>
          ) : (
            visibleCoupons.map((coupon) => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))
          )}
        </View>

        {/* INFO FOOTER */}
        <View style={styles.infoFooter}>
          <Text style={styles.infoFooterText}>
            Acumulado de por vida: {lifetime} pts
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ COUPON CARD ============
function CouponCard({ coupon }: { coupon: UserCoupon }) {
  const isPending = coupon.status === 'pending_admin';
  const isActive = coupon.status === 'active';
  const isRedeemed = coupon.status === 'redeemed';
  const isExpired = coupon.status === 'expired';

  const icon: keyof typeof Ionicons.glyphMap =
    coupon.type === 'free_delivery'
      ? 'bicycle'
      : coupon.type === 'percentage'
        ? 'pricetag'
        : coupon.type === 'product_discount'
          ? 'fast-food'
          : 'gift';

  const headline = (() => {
    if (isPending) return 'Preparando tu cupón…';
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF${coupon.maxDiscount ? ` hasta $${Number(coupon.maxDiscount).toFixed(0)}` : ''}`;
    }
    if (coupon.type === 'fixed') {
      return `$${Number(coupon.value).toFixed(0)} OFF`;
    }
    if (coupon.type === 'free_delivery') {
      return 'ENVÍO GRATIS';
    }
    if (coupon.type === 'product_discount') {
      return `$${Number(coupon.value).toFixed(0)} en producto`;
    }
    return 'Cupón Devo';
  })();

  const expiresIn = (() => {
    if (!coupon.expiresAt) return null;
    try {
      const exp = new Date(coupon.expiresAt);
      const now = new Date();
      const days = Math.ceil(
        (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (days < 0) return 'Expirado';
      if (days === 0) return 'Expira hoy';
      if (days === 1) return 'Expira mañana';
      if (days <= 7) return `Expira en ${days} días`;
      return `Hasta ${exp.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      })}`;
    } catch {
      return null;
    }
  })();

  return (
    <Card
      variant={isPending ? 'glass' : 'raised'}
      padding={s.lg}
      borderRadius={radius.xl}
      style={[
        styles.couponCard,
        (isRedeemed || isExpired) && styles.couponCardDisabled,
      ]}
    >
      <View style={styles.couponLeft}>
        <View
          style={[
            styles.couponIcon,
            isPending && styles.couponIconPending,
          ]}
        >
          <Ionicons
            name={isPending ? 'time' : icon}
            size={22}
            color={isPending ? colors.textMuted : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.couponHeadline,
              isPending && styles.couponHeadlineMuted,
            ]}
          >
            {headline}
          </Text>
          {coupon.description && !isPending && (
            <Text style={styles.couponDescription} numberOfLines={2}>
              {coupon.description}
            </Text>
          )}
          {coupon.restaurant?.name && !isPending && (
            <Text style={styles.couponScope}>
              Solo en {coupon.restaurant.name}
            </Text>
          )}
          {coupon.minOrderAmount && !isPending && (
            <Text style={styles.couponMin}>
              Pedido mínimo ${Number(coupon.minOrderAmount).toFixed(0)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.couponRight}>
        {isPending ? (
          <View style={styles.statusChipPending}>
            <Text style={styles.statusChipTextPending}>PENDIENTE</Text>
          </View>
        ) : isActive ? (
          <>
            <Text style={styles.couponCode}>{coupon.code}</Text>
            {expiresIn && (
              <Text style={styles.couponExpires}>{expiresIn}</Text>
            )}
          </>
        ) : isRedeemed ? (
          <View style={styles.statusChipUsed}>
            <Ionicons name="checkmark" size={11} color={colors.textMuted} />
            <Text style={styles.statusChipTextUsed}>USADO</Text>
          </View>
        ) : (
          <View style={styles.statusChipUsed}>
            <Text style={styles.statusChipTextUsed}>EXPIRADO</Text>
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
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
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  // HERO
  hero: { marginHorizontal: s.xl, alignItems: 'center' },
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
  heroSub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: s.xs,
    textAlign: 'center',
  },
  heroSubStrong: {
    color: colors.text,
    fontWeight: fontWeight.black,
  },
  progressTrack: {
    height: 8,
    width: '100%',
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: s.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
  },
  heroFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: s.lg,
    paddingTop: s.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: s.sm,
  },
  heroFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  heroFooterText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // TABS
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: s.xl,
    marginTop: s.lg,
    gap: s.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: s.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  tabTextActive: { color: colors.onPrimary },

  // LIST
  list: {
    paddingHorizontal: s.xl,
    marginTop: s.md,
    gap: s.sm,
  },
  loading: { paddingVertical: s['2xl'], alignItems: 'center' },
  empty: { alignItems: 'center' },
  emptyHalo: {
    width: 88,
    height: 88,
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
  emptySub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xs,
    paddingHorizontal: s.md,
    lineHeight: 18,
  },

  // COUPON CARD
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  couponCardDisabled: { opacity: 0.55 },
  couponLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  couponIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponIconPending: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  couponHeadline: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  couponHeadlineMuted: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  couponDescription: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    lineHeight: 18,
  },
  couponScope: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  couponMin: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  couponRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  couponCode: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  couponExpires: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },
  statusChipPending: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.4)',
  },
  statusChipTextPending: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.6,
  },
  statusChipUsed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusChipTextUsed: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.6,
  },

  // FOOTER
  infoFooter: {
    paddingHorizontal: s.xl,
    paddingVertical: s.lg,
    alignItems: 'center',
  },
  infoFooterText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
});
