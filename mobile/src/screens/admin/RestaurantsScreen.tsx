// ==========================================
// DEVOLÓN — Admin Restaurants
//
// Lista de negocios con filtros (pendientes / aprobados / todos) y
// acciones inline aprobar / rechazar para pendientes.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../services/api';
import { Restaurant } from '../../types';
import { Card, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type RestaurantsStats = { all: number; approved: number; pending: number };
const EMPTY_R_STATS: RestaurantsStats = { all: 0, approved: 0, pending: 0 };

export default function AdminRestaurantsScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState<RestaurantsStats>(EMPTY_R_STATS);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>(
    'pending',
  );

  useEffect(() => {
    loadRestaurants();
    loadStats();
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadRestaurants();
      loadStats();
    }, [filter]),
  );

  const loadRestaurants = async () => {
    try {
      const data = await adminApi.getRestaurants({ status: filter });
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurants([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getRestaurantsStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading restaurants stats:', error);
    }
  };

  const handleApprove = async (restaurant: Restaurant) => {
    Alert.alert('Aprobar negocio', `¿Aprobar "${restaurant.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          try {
            await adminApi.approveRestaurant(restaurant.id);
            loadRestaurants();
            Alert.alert('Éxito', 'Negocio aprobado');
          } catch (error) {
            Alert.alert('Error', 'No se pudo aprobar');
          }
        },
      },
    ]);
  };

  const handleReject = async (restaurant: Restaurant) => {
    Alert.prompt(
      'Rechazar negocio',
      '¿Por qué rechazas este negocio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await adminApi.rejectRestaurant(
                restaurant.id,
                reason || 'No cumple requisitos',
              );
              loadRestaurants();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar');
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const renderRestaurant = ({ item: restaurant }: { item: Restaurant }) => (
    <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
      <View style={styles.row}>
        <Image
          source={{ uri: restaurant.logo || 'https://via.placeholder.com/80' }}
          style={styles.logo}
        />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {restaurant.category}
          </Text>
          <Text style={styles.address} numberOfLines={1}>
            {restaurant.address.street}
          </Text>
          <View style={styles.meta}>
            {restaurant.isApproved ? (
              <View style={styles.approvedBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={12}
                  color={colors.success}
                />
                <Text style={styles.approvedText}>Aprobado</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={12} color={colors.primary} />
                <Text style={styles.pendingText}>Pendiente</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {!restaurant.isApproved && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleReject(restaurant)}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={16} color={colors.danger} />
            <Text style={styles.rejectBtnText}>RECHAZAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleApprove(restaurant)}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
            <Text style={styles.approveBtnText}>APROBAR</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GESTIÓN</Text>
        <Text style={styles.title}>Negocios</Text>
      </View>

      {/* KPIs grandes — números amarillos hero */}
      <View style={styles.statsWrap}>
        <Card variant="raised" padding={s.md} borderRadius={radius.lg} style={styles.statCard}>
          <Text style={styles.statLabel}>PENDIENTES</Text>
          <Text style={styles.statValue}>{stats.pending}</Text>
        </Card>
        <Card variant="raised" padding={s.md} borderRadius={radius.lg} style={styles.statCard}>
          <Text style={styles.statLabel}>APROBADOS</Text>
          <Text style={styles.statValue}>{stats.approved}</Text>
        </Card>
        <Card variant="raised" padding={s.md} borderRadius={radius.lg} style={styles.statCard}>
          <Text style={styles.statLabel}>TOTAL</Text>
          <Text style={styles.statValue}>{stats.all}</Text>
        </Card>
      </View>

      {/* FILTERS con count badge */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        style={styles.filtersScroll}
      >
        {(['pending', 'approved', 'all'] as const).map((f) => {
          const active = filter === f;
          const count =
            f === 'pending' ? stats.pending :
            f === 'approved' ? stats.approved :
            stats.all;
          const label =
            f === 'pending' ? 'Pendientes' :
            f === 'approved' ? 'Aprobados' :
            'Todos';
          return (
            <TouchableOpacity
              key={f}
              activeOpacity={0.85}
              onPress={() => setFilter(f)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {label}
              </Text>
              <View style={[styles.filterCount, active && styles.filterCountActive]}>
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
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: s.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon="restaurant-outline"
            title="Sin negocios"
            subtitle="No hay negocios para este filtro."
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
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
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

  // ============ STATS (KPI cards arriba) ============
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

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  info: { flex: 1 },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  category: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  address: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    marginTop: 6,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31,174,111,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  approvedText: {
    fontSize: fontSize.xxs,
    color: colors.success,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,194,14,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  pendingText: {
    fontSize: fontSize.xxs,
    color: colors.primary,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // ============ ACTIONS ============
  actions: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.sm,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: s.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.32)',
    backgroundColor: 'rgba(229,72,77,0.08)',
  },
  rejectBtnText: {
    color: colors.danger,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: s.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  approveBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
});
