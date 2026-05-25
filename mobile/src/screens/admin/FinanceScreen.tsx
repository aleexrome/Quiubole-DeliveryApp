// ==========================================
// DEVOLÓN — Admin Finance
//
// Estado de cuenta y finanzas globales. KPIs principales en card hero
// negra con números amarillos, secciones (Ingresos/Por pagar/Efectivo)
// como cards glass con filas, ganancia neta destacada y tabs internas
// (Resumen / Movimientos / Pendientes).
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/api';
import { Card, Button, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type Period = 'today' | 'week' | 'month' | 'custom';

interface FinancialSummary {
  totalSales: number;
  totalOrders: number;
  restaurantCommissions: number;
  serviceFeesCollected: number;
  deliveryFeesCollected: number;
  owedToRestaurants: number;
  owedToDrivers: number;
  pendingFromDrivers: number;
  netProfit: number;
  cardPayments: number;
  cashPayments: number;
}

interface Transaction {
  id: string;
  type: 'order' | 'driver_payout' | 'restaurant_payout' | 'driver_settlement' | 'refund';
  orderNumber?: string;
  description: string;
  amount: number;
  fee: number;
  net: number;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: 'card' | 'cash';
  restaurant?: string;
  driver?: string;
  customer?: string;
  createdAt: Date;
}

const formatCurrency = (amount: number | undefined | null) =>
  `$${(amount ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

const formatDate = (date: Date | string | undefined | null) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const txMeta = (type: string): { icon: keyof typeof Ionicons.glyphMap; tint: string } => {
  switch (type) {
    case 'order':
      return { icon: 'receipt-outline', tint: colors.success };
    case 'driver_payout':
      return { icon: 'bicycle-outline', tint: colors.info };
    case 'restaurant_payout':
      return { icon: 'restaurant-outline', tint: colors.primary };
    case 'driver_settlement':
      return { icon: 'cash-outline', tint: colors.info };
    case 'refund':
      return { icon: 'arrow-undo-outline', tint: colors.danger };
    default:
      return { icon: 'help-outline', tint: colors.textMuted };
  }
};

export default function AdminFinanceScreen() {
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState<Period>('today');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'summary' | 'transactions' | 'pending'>('summary');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const [summaryData, transactionsData] = await Promise.all([
        adminApi.getFinancialSummary(period),
        adminApi.getTransactions(period),
      ]);
      setSummary(summaryData);
      setTransactions(transactionsData);
    } catch {
      setSummary({
        totalSales: 45680.5,
        totalOrders: 234,
        restaurantCommissions: 6852.08,
        serviceFeesCollected: 3654.44,
        deliveryFeesCollected: 5850.0,
        owedToRestaurants: 38828.42,
        owedToDrivers: 4680.0,
        pendingFromDrivers: 2340.0,
        netProfit: 8016.52,
        cardPayments: 32500.0,
        cashPayments: 13180.5,
      });
      setTransactions([
        {
          id: '1',
          type: 'order',
          orderNumber: 'DVL-ABC123',
          description: 'Pedido completado',
          amount: 285.0,
          fee: 42.75,
          net: 42.75,
          status: 'completed',
          paymentMethod: 'card',
          restaurant: 'Tacos El Güero',
          driver: 'Juan Pérez',
          customer: 'María García',
          createdAt: new Date(),
        },
      ]);
    }
  };

  const renderSummary = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Hero card */}
      <Card variant="raised" padding={s.xl} borderRadius={radius.xl} style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>RESUMEN</Text>
        <Text style={styles.heroDate}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>VENTAS TOTALES</Text>
            <Text style={styles.heroStatValue}>{formatCurrency(summary?.totalSales || 0)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>PEDIDOS</Text>
            <Text style={styles.heroStatValue}>{summary?.totalOrders || 0}</Text>
          </View>
        </View>
      </Card>

      {/* Ingresos */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionEyebrow}>INGRESOS</Text>
        <Card variant="glass" padding={s.lg} borderRadius={radius.xl}>
          <FinanceRow label="Comisión restaurantes (15%)" value={summary?.restaurantCommissions || 0} sign="+" tint={colors.success} />
          <Divider />
          <FinanceRow label="Tarifa de servicio (8%)" value={summary?.serviceFeesCollected || 0} sign="+" tint={colors.success} />
          <Divider />
          <FinanceRow label="Parte de envíos" value={(summary?.deliveryFeesCollected || 0) * 0.3} sign="+" tint={colors.success} />
          <Divider />
          <TotalRow
            label="Total ingresos"
            value={
              (summary?.restaurantCommissions || 0) +
              (summary?.serviceFeesCollected || 0) +
              (summary?.deliveryFeesCollected || 0) * 0.3
            }
            tint={colors.success}
          />
        </Card>
      </View>

      {/* Por pagar */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionEyebrow}>POR PAGAR</Text>
        <Card variant="glass" padding={s.lg} borderRadius={radius.xl}>
          <FinanceRow label="A restaurantes" value={summary?.owedToRestaurants || 0} sign="−" tint={colors.danger} />
          <Divider />
          <FinanceRow label="A repartidores" value={summary?.owedToDrivers || 0} sign="−" tint={colors.danger} />
          <Divider />
          <TotalRow
            label="Total por pagar"
            value={(summary?.owedToRestaurants || 0) + (summary?.owedToDrivers || 0)}
            tint={colors.danger}
          />
        </Card>
      </View>

      {/* Efectivo */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionEyebrow}>EFECTIVO</Text>
        <Card variant="glass" padding={s.lg} borderRadius={radius.xl}>
          <FinanceRow label="Cobrado en efectivo" value={summary?.cashPayments || 0} />
          <Divider />
          <FinanceRow label="Pendiente de liquidar" value={summary?.pendingFromDrivers || 0} tint={colors.primary} />
          <Divider />
          <FinanceRow label="Cobrado con tarjeta" value={summary?.cardPayments || 0} />
        </Card>
      </View>

      {/* Ganancia neta — destacada en amarillo */}
      <Card variant="raised" padding={s.xl} borderRadius={radius.xl} style={styles.profitCard}>
        <View style={styles.profitHeader}>
          <Ionicons name="wallet" size={28} color={colors.onPrimary} />
          <Text style={styles.profitTitle}>GANANCIA NETA</Text>
        </View>
        <Text style={styles.profitValue}>{formatCurrency(summary?.netProfit || 0)}</Text>
        <Text style={styles.profitSubtext}>
          Después de pagar a restaurantes y repartidores
        </Text>
      </Card>
    </ScrollView>
  );

  const renderTransactions = () => (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.tabContent}
      renderItem={({ item }) => {
        const meta = txMeta(item.type);
        const isRefund = item.type === 'refund';
        return (
          <Card variant="glass" padding={s.md} borderRadius={radius.lg} style={styles.txCard}>
            <View
              style={[
                styles.txIcon,
                { backgroundColor: `${meta.tint}1F`, borderColor: `${meta.tint}55` },
              ]}
            >
              <Ionicons name={meta.icon} size={18} color={meta.tint} />
            </View>
            <View style={styles.txBody}>
              <View style={styles.txHead}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {item.orderNumber || item.description}
                </Text>
                <Text style={[styles.txAmount, { color: isRefund ? colors.danger : colors.success }]}>
                  {isRefund ? '−' : '+'}
                  {formatCurrency(item.net)}
                </Text>
              </View>
              <Text style={styles.txDetails}>
                {item.restaurant && `${item.restaurant} · `}
                {item.paymentMethod === 'cash' ? 'EFECTIVO' : 'TARJETA'}
              </Text>
              <Text style={styles.txTime}>{formatDate(item.createdAt)}</Text>
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={
        <EmptyState
          icon="document-text-outline"
          title="Sin transacciones"
          subtitle="No hay movimientos en este período."
        />
      }
    />
  );

  const renderPending = () => (
    <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      {/* Drivers pending */}
      <Text style={styles.sectionEyebrow}>LIQUIDACIONES PENDIENTES</Text>
      <PendingDriverCard name="Juan Pérez" phone="55 1234 5678" amount={850} orders={8} hours={2} />
      <PendingDriverCard name="Carlos López" phone="55 9876 5432" amount={420} orders={4} hours={5} />

      {/* Restaurants payouts */}
      <Text style={[styles.sectionEyebrow, { marginTop: s.xl }]}>PAGOS A RESTAURANTES (SEMANAL)</Text>
      <PayoutCard name="Tacos El Güero" orders={47} amount={8450} />
      <PayoutCard name="Pizzería Roma" orders={32} amount={6280} />
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>FINANZAS</Text>
          <Text style={styles.title}>Estado de cuenta</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} activeOpacity={0.85}>
          <Ionicons name="download-outline" size={16} color={colors.primary} />
          <Text style={styles.exportBtnText}>EXPORTAR</Text>
        </TouchableOpacity>
      </View>

      {/* Period pills */}
      <View style={styles.periodRow}>
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodPill, period === p && styles.periodPillActive]}
            onPress={() => setPeriod(p)}
            activeOpacity={0.85}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'today' ? 'HOY' : p === 'week' ? 'SEMANA' : 'MES'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['summary', 'transactions', 'pending'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t === 'summary' ? 'RESUMEN' : t === 'transactions' ? 'MOVIMIENTOS' : 'PENDIENTES'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'summary' && renderSummary()}
      {activeTab === 'transactions' && renderTransactions()}
      {activeTab === 'pending' && renderPending()}
    </SafeAreaView>
  );
}

/* ============================================
   Reusable sub-components dentro del módulo
   ============================================ */

function FinanceRow({
  label,
  value,
  sign,
  tint = colors.text,
}: {
  label: string;
  value: number;
  sign?: '+' | '−';
  tint?: string;
}) {
  return (
    <View style={localStyles.financeRow}>
      <Text style={localStyles.financeLabel}>{label}</Text>
      <Text style={[localStyles.financeValue, { color: tint }]}>
        {sign}
        {formatCurrency(value)}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={localStyles.divider} />;
}

function TotalRow({ label, value, tint = colors.text }: { label: string; value: number; tint?: string }) {
  return (
    <View style={localStyles.totalRow}>
      <Text style={localStyles.totalLabel}>{label}</Text>
      <Text style={[localStyles.totalValue, { color: tint }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

function PendingDriverCard({
  name,
  phone,
  amount,
  orders,
  hours,
}: {
  name: string;
  phone: string;
  amount: number;
  orders: number;
  hours: number;
}) {
  return (
    <Card variant="glass" padding={s.md} borderRadius={radius.xl} style={{ marginTop: s.sm }}>
      <View style={localStyles.pendingHead}>
        <View style={localStyles.driverAvatar}>
          <Ionicons name="person-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={localStyles.driverName}>{name}</Text>
          <Text style={localStyles.driverPhone}>{phone}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={localStyles.pendingLabel}>DEBE</Text>
          <Text style={localStyles.pendingValue}>{formatCurrency(amount)}</Text>
        </View>
      </View>
      <Text style={localStyles.pendingDetail}>
        {orders} pedidos en efectivo · Último: hace {hours}h
      </Text>
      <View style={localStyles.pendingActions}>
        <View style={{ flex: 1 }}>
          <Button label="RECORDAR" variant="secondary" size="sm" icon="notifications-outline" iconPosition="left" />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="CONFIRMAR PAGO" variant="primary" size="sm" icon="checkmark" iconPosition="left" />
        </View>
      </View>
    </Card>
  );
}

function PayoutCard({ name, orders, amount }: { name: string; orders: number; amount: number }) {
  return (
    <Card variant="glass" padding={s.md} borderRadius={radius.xl} style={{ marginTop: s.sm }}>
      <View style={localStyles.payoutHead}>
        <View style={localStyles.restaurantAvatar}>
          <Ionicons name="restaurant-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={localStyles.driverName}>{name}</Text>
          <Text style={localStyles.driverPhone}>{orders} pedidos esta semana</Text>
        </View>
        <Text style={localStyles.payoutAmount}>{formatCurrency(amount)}</Text>
      </View>
      <View style={{ marginTop: s.sm }}>
        <Button label="MARCAR COMO PAGADO" variant="secondary" size="sm" />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    paddingHorizontal: s.md,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    backgroundColor: 'rgba(255,194,14,0.1)',
  },
  exportBtnText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },

  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: s.xl,
    gap: s.xs,
    marginBottom: s.md,
  },
  periodPill: {
    flex: 1,
    paddingVertical: s.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  periodPillActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  periodText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  periodTextActive: { color: colors.primary },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: s.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: s.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  tabTextActive: { color: colors.primary },

  tabContent: {
    paddingHorizontal: s.xl,
    paddingTop: s.md,
    paddingBottom: s['4xl'],
  },

  // Hero KPI card
  heroCard: {},
  heroEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  heroDate: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: s.lg,
  },
  heroStat: { flex: 1 },
  heroStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  heroStatValue: {
    color: colors.primary,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: s.md,
  },

  // Sections
  sectionWrap: { marginTop: s.xl },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.sm,
    paddingLeft: s.xs,
  },

  // Profit card
  profitCard: {
    marginTop: s.xl,
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.glow,
  },
  profitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  profitTitle: {
    color: colors.onPrimary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  profitValue: {
    color: colors.onPrimary,
    fontSize: fontSize['4xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -1,
    marginTop: s.sm,
  },
  profitSubtext: {
    color: 'rgba(0,0,0,0.65)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: s.xs,
    textAlign: 'center',
  },

  // Transactions
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.xs,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txBody: { flex: 1 },
  txHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txTitle: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginRight: s.xs,
  },
  txAmount: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  txDetails: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 4,
  },
  txTime: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
});

const localStyles = StyleSheet.create({
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: s.sm,
  },
  financeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  financeValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: s.md,
    marginTop: s.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },

  pendingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  driverPhone: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  pendingLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  pendingValue: {
    color: colors.danger,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  pendingDetail: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: s.sm,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.md,
  },

  payoutHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  payoutAmount: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
});
