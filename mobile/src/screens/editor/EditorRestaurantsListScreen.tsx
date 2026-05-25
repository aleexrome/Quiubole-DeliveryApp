// ==========================================
// DEVOLÓN — Editor / Restaurantes asignados
//
// Tab principal del editor: lista de restaurantes que el admin le asignó
// para gestionar (menú, info, fotos, horarios). Cards glass con logo,
// nombre, dirección y badge de estado (Aprobado / Pendiente). Header
// inline editorial (eyebrow + título grande). No lleva FAB — el editor
// no crea restaurantes, solo los edita.
// ==========================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { editorsApi } from '../../services/api';
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

export default function EditorRestaurantsListScreen() {
  const navigation = useNavigation<any>();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await editorsApi.getMyRestaurants();
      setRestaurants(data);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || 'No se pudieron cargar tus restaurantes',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Recarga al volver a la pantalla (por si admin cambió asignaciones)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }: { item: Restaurant }) => {
    const address =
      typeof item.address === 'string'
        ? item.address
        : (item.address as any)?.street || '—';

    return (
      <Card
        variant="glass"
        onPress={() =>
          navigation.navigate('EditorMenu', {
            restaurantId: item.id,
            restaurantName: item.name,
          })
        }
        padding={s.md}
        borderRadius={radius.xl}
        style={styles.card}
      >
        {item.logo ? (
          <Image source={{ uri: item.logo }} style={styles.logo} />
        ) : (
          <View style={[styles.logo, styles.logoPlaceholder]}>
            <Ionicons name="restaurant" size={26} color={colors.primary} />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.addressRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={colors.textMuted}
            />
            <Text style={styles.cardAddress} numberOfLines={1}>
              {address}
            </Text>
          </View>
          <View style={styles.badges}>
            <View
              style={[
                styles.badge,
                item.isApproved ? styles.badgeApproved : styles.badgePending,
              ]}
            >
              <View
                style={[
                  styles.badgeDot,
                  {
                    backgroundColor: item.isApproved
                      ? colors.success
                      : colors.primary,
                  },
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: item.isApproved ? colors.success : colors.primary,
                  },
                ]}
              >
                {item.isApproved ? 'Aprobado' : 'Pendiente'}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>EDITOR</Text>
        <Text style={styles.title}>Mis restaurantes</Text>
        <Text style={styles.subtitle}>
          {restaurants.length} asignado{restaurants.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <Text style={styles.errorText} numberOfLines={2}>
            {error}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={restaurants}
        keyExtractor={(r) => r.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: s.xs }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="cafe-outline"
            title="Sin asignaciones aún"
            subtitle="El administrador todavía no te ha asignado ningún restaurante. Cuando lo haga aparecerán aquí."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ HEADER ============
  header: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.lg,
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
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },

  // ============ LIST ============
  listContent: {
    paddingHorizontal: s.xl,
    paddingBottom: s['3xl'],
    flexGrow: 1,
  },

  // ============ CARD ============
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
  },
  logoPlaceholder: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1, gap: 4 },
  cardName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardAddress: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  badges: {
    flexDirection: 'row',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeApproved: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderColor: 'rgba(31,174,111,0.32)',
  },
  badgePending: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.32)',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase',
  },

  // ============ ERROR ============
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    backgroundColor: 'rgba(229,72,77,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.32)',
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    marginHorizontal: s.xl,
    marginBottom: s.sm,
    borderRadius: radius.md,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
