// ==========================================
// DEVOLÓN — Admin Dashboard
//
// Panel global con KPIs principales (pedidos hoy / ingresos hoy), grid
// secundario de entidades (usuarios, negocios, repartidores, productos,
// editores), alert pendiente de aprobaciones y bloque de gestión.
// Inspiración: Stripe + Linear (data-dense, dark, hierarchy clara).
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../services/api';
import { Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface DashboardStats {
  totalOrders: number;
  ordersToday: number;
  totalRevenue: number;
  revenueToday: number;
  activeUsers: number;
  activeDrivers: number;
  activeRestaurants: number;
  pendingRestaurants: number;
  pendingDrivers: number;
  pendingProducts: number;
  // Campos extra que devuelve el backend para el grid de entidades.
  totalUsers?: number;
  totalRestaurants?: number;
  totalDrivers?: number;
  totalEditors?: number;
  totalCustomers?: number;
  totalProducts?: number;
}

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    ordersToday: 0,
    totalRevenue: 0,
    revenueToday: 0,
    activeUsers: 0,
    activeDrivers: 0,
    activeRestaurants: 0,
    pendingRestaurants: 0,
    pendingDrivers: 0,
    pendingProducts: 0,
    totalUsers: 0,
    totalRestaurants: 0,
    totalDrivers: 0,
    totalEditors: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Refresca cada vez que la tab "Panel" se enfoca (al abrir la app y
  // cada vez que el usuario navega de vuelta desde otra tab). Sin esto
  // el dashboard solo cargaba una vez al montarse y quedaba stale si la
  // data cambiaba en background.
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // Defensivo: si el backend devuelve undefined/null (endpoint nuevo
  // todavía no rebooteado, fallo de red, etc.) renderizamos $0.00 en
  // lugar de crashear la pantalla.
  const formatCurrency = (amount: number | undefined | null) =>
    `$${(amount ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  const pendingTotal =
    stats.pendingRestaurants + stats.pendingDrivers + stats.pendingProducts;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>DEVOLÓN · ADMIN</Text>
            <Text style={styles.headerTitle}>Panel global</Text>
          </View>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Restaurants')}
          >
            <Ionicons
              name="notifications-outline"
              size={20}
              color={colors.text}
            />
            {pendingTotal > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {pendingTotal > 9 ? '9+' : pendingTotal}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* PENDING ALERT — clickeable, lleva a Restaurants pending */}
        {pendingTotal > 0 && (
          <View style={{ paddingHorizontal: s.xl }}>
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.xl}
              onPress={() => navigation.navigate('Restaurants')}
              style={styles.alertCard}
            >
              <View style={styles.alertIcon}>
                <Ionicons name="alert-circle" size={20} color={colors.primary} />
              </View>
              <View style={styles.alertBody}>
                <Text style={styles.alertTitle}>
                  {pendingTotal} aprobaciones pendientes
                </Text>
                <Text style={styles.alertText} numberOfLines={1}>
                  {stats.pendingRestaurants} negocios · {stats.pendingDrivers}{' '}
                  repartidores · {stats.pendingProducts} productos
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.primary}
              />
            </Card>
          </View>
        )}

        {/* KPI PRINCIPALES — clickeables, llevan a sus pantallas detalle.
            Cada card muestra el dato de HOY en grande y, abajo, el
            total histórico para dar contexto del crecimiento. */}
        <View style={styles.kpiSection}>
          <Text style={styles.sectionEyebrow}>RESUMEN</Text>
          <View style={styles.kpiGrid}>
            <Card
              variant="raised"
              padding={s.lg}
              borderRadius={radius.xl}
              onPress={() => navigation.navigate('Orders')}
              style={styles.kpiCard}
            >
              <View style={styles.kpiHeader}>
                <Ionicons name="receipt" size={16} color={colors.primary} />
                <Text style={styles.kpiLabel}>PEDIDOS HOY</Text>
              </View>
              <Text style={styles.kpiValue}>{stats.ordersToday}</Text>
              <View style={styles.kpiFooter}>
                <Text style={styles.kpiFooterLabel}>HISTÓRICO</Text>
                <View style={styles.kpiFooterRight}>
                  <Text style={styles.kpiFooterValue}>
                    {stats.totalOrders}
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                </View>
              </View>
            </Card>

            <Card
              variant="raised"
              padding={s.lg}
              borderRadius={radius.xl}
              onPress={() => navigation.navigate('AdminFinance')}
              style={styles.kpiCard}
            >
              <View style={styles.kpiHeader}>
                <Ionicons name="cash" size={16} color={colors.primary} />
                <Text style={styles.kpiLabel}>INGRESOS HOY</Text>
              </View>
              <Text style={styles.kpiValue}>
                {formatCurrency(stats.revenueToday)}
              </Text>
              <View style={styles.kpiFooter}>
                <Text style={styles.kpiFooterLabel}>HISTÓRICO</Text>
                <View style={styles.kpiFooterRight}>
                  <Text style={styles.kpiFooterValue}>
                    {formatCurrency(stats.totalRevenue)}
                  </Text>
                  <Ionicons name="chevron-forward" size={12} color={colors.textMuted} />
                </View>
              </View>
            </Card>
          </View>
        </View>

        {/* ENTIDADES GRID */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ENTIDADES</Text>
          <View style={styles.entityGrid}>
            {/* Cada card muestra el TOTAL real de la entidad (no
                filtrado por active/approved). Eso evita confusión cuando
                un user existe pero está "inactivo" o un negocio aún no
                ha sido aprobado. */}
            <Card
              variant="glass"
              onPress={() => navigation.navigate('Users')}
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.entityCard}
            >
              <View style={styles.entityIcon}>
                <Ionicons name="people" size={18} color={colors.primary} />
              </View>
              <Text style={styles.entityValue}>{stats.totalUsers ?? 0}</Text>
              <Text style={styles.entityLabel}>USUARIOS</Text>
            </Card>

            <Card
              variant="glass"
              onPress={() => navigation.navigate('Restaurants')}
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.entityCard}
            >
              <View style={styles.entityIcon}>
                <Ionicons name="restaurant" size={18} color={colors.primary} />
              </View>
              <Text style={styles.entityValue}>{stats.totalRestaurants ?? 0}</Text>
              <Text style={styles.entityLabel}>NEGOCIOS</Text>
            </Card>

            <Card
              variant="glass"
              onPress={() => navigation.navigate('AdminDrivers')}
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.entityCard}
            >
              <View style={styles.entityIcon}>
                <Ionicons name="bicycle" size={18} color={colors.primary} />
              </View>
              <Text style={styles.entityValue}>{stats.totalDrivers ?? 0}</Text>
              <Text style={styles.entityLabel}>REPARTIDORES</Text>
            </Card>

            <Card
              variant="glass"
              onPress={() => navigation.navigate('AdminProducts')}
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.entityCard}
            >
              <View style={styles.entityIcon}>
                <Ionicons name="fast-food" size={18} color={colors.primary} />
              </View>
              <Text style={styles.entityValue}>{stats.totalProducts ?? 0}</Text>
              <Text style={styles.entityLabel}>PRODUCTOS</Text>
            </Card>

            <Card
              variant="glass"
              onPress={() => navigation.navigate('AdminEditors')}
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.entityCard}
            >
              <View style={styles.entityIcon}>
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </View>
              <Text style={styles.entityValue}>{stats.totalEditors ?? 0}</Text>
              <Text style={styles.entityLabel}>EDITORES</Text>
            </Card>
          </View>
        </View>

        {/* APROBACIONES */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>APROBACIONES</Text>

          <Card
            variant="glass"
            onPress={() => navigation.navigate('Restaurants')}
            padding={s.md}
            borderRadius={radius.lg}
            style={styles.actionCard}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="restaurant" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Negocios por aprobar</Text>
              <Text style={styles.actionSubtitle}>
                {stats.pendingRestaurants} pendientes
              </Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>
                {stats.pendingRestaurants}
              </Text>
            </View>
          </Card>

          <Card
            variant="glass"
            onPress={() => navigation.navigate('AdminDrivers')}
            padding={s.md}
            borderRadius={radius.lg}
            style={styles.actionCard}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="bicycle" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Repartidores por aprobar</Text>
              <Text style={styles.actionSubtitle}>
                {stats.pendingDrivers} pendientes
              </Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>
                {stats.pendingDrivers}
              </Text>
            </View>
          </Card>

          {/* Editores pendientes — solo se muestra si hay alguno */}
          {(stats as any).pendingEditors > 0 && (
            <Card
              variant="glass"
              onPress={() => navigation.navigate('AdminEditors')}
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.actionCard}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="create-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Editores por aprobar</Text>
                <Text style={styles.actionSubtitle}>
                  {(stats as any).pendingEditors} pendientes
                </Text>
              </View>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>
                  {(stats as any).pendingEditors}
                </Text>
              </View>
            </Card>
          )}

          <Card
            variant="glass"
            onPress={() => navigation.navigate('AdminProducts')}
            padding={s.md}
            borderRadius={radius.lg}
            style={styles.actionCard}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="fast-food" size={20} color={colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Productos por aprobar</Text>
              <Text style={styles.actionSubtitle}>
                {stats.pendingProducts} pendientes
              </Text>
            </View>
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>
                {stats.pendingProducts}
              </Text>
            </View>
          </Card>
        </View>

        {/* GESTION — todos los tiles clickeables. Las features que aún
            no tienen pantalla muestran un Alert "Próximamente" en lugar
            de no responder, para que el user reciba feedback claro. */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>GESTIÓN</Text>
          <View style={styles.mgmtGrid}>
            <Card
              variant="glass"
              onPress={() =>
                Alert.alert(
                  'Cupones',
                  'Próximamente: crea y gestiona códigos de descuento.',
                )
              }
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.mgmtCard}
            >
              <Ionicons name="pricetag" size={22} color={colors.primary} />
              <Text style={styles.mgmtText}>Cupones</Text>
            </Card>
            <Card
              variant="glass"
              onPress={() =>
                Alert.alert(
                  'Zonas',
                  'Próximamente: define áreas de cobertura por colonia.',
                )
              }
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.mgmtCard}
            >
              <Ionicons name="map" size={22} color={colors.primary} />
              <Text style={styles.mgmtText}>Zonas</Text>
            </Card>
            <Card
              variant="glass"
              onPress={() =>
                Alert.alert(
                  'Reportes',
                  'Próximamente: exporta reportes en PDF y CSV.',
                )
              }
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.mgmtCard}
            >
              <Ionicons name="analytics" size={22} color={colors.primary} />
              <Text style={styles.mgmtText}>Reportes</Text>
            </Card>
            <Card
              variant="glass"
              onPress={() => navigation.navigate('Settings')}
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.mgmtCard}
            >
              <Ionicons name="settings" size={22} color={colors.primary} />
              <Text style={styles.mgmtText}>Config</Text>
            </Card>
          </View>
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
    paddingBottom: s.lg,
  },
  headerLeft: { flex: 1 },
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
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
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

  // ============ ALERT ============
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    borderColor: 'rgba(255,194,14,0.25)',
  },
  alertIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: { flex: 1 },
  alertTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  alertText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // ============ SECTIONS ============
  section: {
    paddingHorizontal: s.xl,
    marginTop: s.xl,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
    marginBottom: s.sm,
  },

  // ============ KPI ============
  kpiSection: {
    paddingHorizontal: s.xl,
    marginTop: s.lg,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: s.sm,
  },
  kpiCard: {
    flex: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: s.sm,
  },
  kpiLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  kpiValue: {
    color: colors.primary,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
  },
  kpiDelta: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: s.xs,
  },
  // Footer del KPI: separa el valor HOY (arriba, grande) del HISTÓRICO
  // (abajo, comparativo). Línea horizontal para que se lea como una
  // tabla rápida sin ambigüedad ("¿qué es ese 2 abajo?").
  kpiFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s.sm,
    paddingTop: s.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  kpiFooterLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  kpiFooterValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  kpiFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // ============ ENTITY GRID ============
  entityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  entityCard: {
    flex: 1,
    minWidth: '30%',
    alignItems: 'flex-start',
  },
  entityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.xs,
  },
  entityValue: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
  },
  entityLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 2,
  },

  // ============ ACTION CARD ============
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.xs,
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
  },
  actionContent: { flex: 1 },
  actionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  actionBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: 28,
    paddingHorizontal: s.xs,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBadgeText: {
    color: colors.onPrimary,
    fontWeight: fontWeight.black,
    fontSize: fontSize.xs,
  },

  // ============ MGMT GRID ============
  mgmtGrid: {
    flexDirection: 'row',
    gap: s.xs,
  },
  mgmtCard: {
    flex: 1,
    alignItems: 'center',
    gap: s.xs,
  },
  mgmtText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
});
