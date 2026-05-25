// ==========================================
// DEVOLÓN — Admin Drivers
//
// Sub-pantalla del stack. Lista real de repartidores con filtros
// (todos/activos/inactivos/por aprobar) + KPIs poblados desde el
// endpoint /admin/drivers-stats. Renderiza cada driver como card glass.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Alert } from 'react-native';
import { adminApi } from '../../services/api';
import { User } from '../../types';
import { Card, Header, EmptyState, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type DriverFilter = 'all' | 'active' | 'inactive' | 'pending';

type DriverStats = { all: number; active: number; inactive: number; pending: number };

const EMPTY_STATS: DriverStats = { all: 0, active: 0, inactive: 0, pending: 0 };

export default function DriversScreen() {
  const [filter, setFilter] = useState<DriverFilter>('all');
  const [drivers, setDrivers] = useState<User[]>([]);
  const [stats, setStats] = useState<DriverStats>(EMPTY_STATS);

  useEffect(() => {
    loadDrivers();
  }, [filter]);

  useEffect(() => {
    loadStats();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDrivers();
      loadStats();
    }, [filter]),
  );

  const loadDrivers = async () => {
    try {
      const data = await adminApi.getDrivers({ status: filter });
      setDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading drivers:', error);
      setDrivers([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getDriversStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading driver stats:', error);
    }
  };

  const filters: { key: DriverFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Activos' },
    { key: 'inactive', label: 'Inactivos' },
    { key: 'pending', label: 'Por aprobar' },
  ];

  const handleApprove = (driver: User) => {
    Alert.alert(
      'Aprobar repartidor',
      `¿Aprobar a ${driver.firstName || driver.name || driver.email}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            try {
              await adminApi.approveUser(driver.id);
              await loadDrivers();
              await loadStats();
              Alert.alert('Aprobado', 'El repartidor ya puede operar.');
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'No se pudo aprobar');
            }
          },
        },
      ],
    );
  };

  const handleReject = (driver: User) => {
    Alert.prompt?.(
      'Rechazar repartidor',
      '¿Por qué rechazas a este repartidor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async (reason?: string) => {
            try {
              await adminApi.rejectUser(driver.id, reason || 'No cumple requisitos');
              await loadDrivers();
              await loadStats();
            } catch (e: any) {
              Alert.alert('Error', e?.response?.data?.message || 'No se pudo rechazar');
            }
          },
        },
      ],
      'plain-text',
    );
    // Fallback Android (Alert.prompt no existe en Android): rechazo sin razón.
    if (typeof Alert.prompt !== 'function') {
      Alert.alert(
        'Rechazar repartidor',
        '¿Seguro? Esta cuenta será marcada como rechazada.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Rechazar',
            style: 'destructive',
            onPress: async () => {
              try {
                await adminApi.rejectUser(driver.id, 'No cumple requisitos');
                await loadDrivers();
                await loadStats();
              } catch (e: any) {
                Alert.alert('Error', e?.response?.data?.message || 'No se pudo rechazar');
              }
            },
          },
        ],
      );
    }
  };

  const renderDriver = ({ item: driver }: { item: User }) => {
    const isAvailable = (driver as any).isAvailable;
    const isPending = (driver as any).isApproved === false;

    return (
      <Card variant="glass" padding={s.md} borderRadius={radius.xl} style={styles.driverCard}>
        <View style={styles.driverRow}>
          {driver.avatar ? (
            <Image source={{ uri: driver.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Ionicons name="bicycle" size={22} color={colors.primary} />
            </View>
          )}
          <View style={styles.driverInfo}>
            <Text style={styles.driverName} numberOfLines={1}>
              {(driver as any).firstName || driver.name || driver.email}
              {(driver as any).lastName ? ` ${(driver as any).lastName}` : ''}
            </Text>
            <Text style={styles.driverEmail} numberOfLines={1}>
              {driver.email}
            </Text>
            <View style={styles.metaRow}>
              {isPending ? (
                <View style={[styles.statusBadge, styles.statusBadgePending]}>
                  <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.statusText, { color: colors.primary }]}>EN REVISIÓN</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.statusBadge,
                    isAvailable ? styles.statusBadgeActive : styles.statusBadgeInactive,
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: isAvailable ? colors.success : colors.textMuted },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      { color: isAvailable ? colors.success : colors.textMuted },
                    ]}
                  >
                    {isAvailable ? 'ACTIVO' : 'OFFLINE'}
                  </Text>
                </View>
              )}
              {driver.emailVerified && (
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              )}
            </View>
          </View>
        </View>

        {isPending && (
          <View style={styles.actionsRow}>
            <View style={{ flex: 1 }}>
              <Button
                label="RECHAZAR"
                variant="secondary"
                size="sm"
                onPress={() => handleReject(driver)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label="APROBAR"
                variant="primary"
                size="sm"
                icon="checkmark"
                iconPosition="left"
                onPress={() => handleApprove(driver)}
              />
            </View>
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header eyebrow="DEVOLÓN · ADMIN" title="Repartidores" />

      <View style={styles.subheader}>
        <Text style={styles.subtitle}>
          Gestiona repartidores activos y aprobaciones pendientes.
        </Text>
      </View>

      {/* FILTERS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
      >
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              activeOpacity={0.85}
              onPress={() => setFilter(f.key)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* KPI ROW */}
      <View style={styles.kpiRow}>
        <Card variant="raised" padding={s.md} borderRadius={radius.lg} style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>ACTIVOS</Text>
          <Text style={styles.kpiValue}>{stats.active}</Text>
        </Card>
        <Card variant="raised" padding={s.md} borderRadius={radius.lg} style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>POR APROBAR</Text>
          <Text style={styles.kpiValue}>{stats.pending}</Text>
        </Card>
        <Card variant="raised" padding={s.md} borderRadius={radius.lg} style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>INACTIVOS</Text>
          <Text style={styles.kpiValue}>{stats.inactive}</Text>
        </Card>
      </View>

      {/* LIST */}
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={renderDriver}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: s.xs }} />}
        ListEmptyComponent={
          <EmptyState
            icon="bicycle-outline"
            title="Sin repartidores"
            subtitle="No hay repartidores en este filtro."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  subheader: {
    paddingHorizontal: s.xl,
    paddingTop: s.xs,
    paddingBottom: s.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

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

  kpiRow: {
    flexDirection: 'row',
    gap: s.xs,
    paddingHorizontal: s.xl,
    paddingBottom: s.md,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'flex-start',
  },
  kpiLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  kpiValue: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 4,
  },

  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
  },

  driverCard: {},
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.md,
    paddingTop: s.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadgePending: {
    backgroundColor: 'rgba(255,194,14,0.12)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  // Igual patrón que UsersScreen: cuando el driver no tiene foto,
  // pintamos un círculo glass con tinte amarillo + icono de bicicleta.
  // Mantiene el lenguaje visual del rol.
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInfo: { flex: 1 },
  driverName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  driverEmail: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusBadgeActive: { backgroundColor: 'rgba(31,174,111,0.12)' },
  statusBadgeInactive: { backgroundColor: colors.surface },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
  },
  kebabBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
});
