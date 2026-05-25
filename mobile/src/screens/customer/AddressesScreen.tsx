// ==========================================
// DEVOLÓN — Customer / Mis direcciones
//
// Lista de direcciones guardadas del cliente. Tap card → editar. FAB
// abajo para crear nueva. Cada card muestra label (Casa, Oficina…),
// calle completa, badge "Por defecto", botón overflow con opciones
// (Marcar como predeterminada / Eliminar).
// ==========================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { addressesApi } from '../../services/api';
import { Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface Address {
  id: string;
  label?: string;
  street: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude: number;
  longitude: number;
  instructions?: string;
  isDefault: boolean;
  createdAt: string;
}

// Label legible + icono según el "label" guardado.
const LABEL_META: Record<
  string,
  { display: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  home: { display: 'Casa', icon: 'home' },
  work: { display: 'Oficina', icon: 'briefcase' },
  other: { display: 'Otra', icon: 'location' },
};

function metaFor(label?: string) {
  if (!label) return { display: 'Sin nombre', icon: 'location' as const };
  const key = label.toLowerCase();
  if (LABEL_META[key]) return LABEL_META[key];
  return { display: label, icon: 'location' as const };
}

export default function CustomerAddressesScreen() {
  const navigation = useNavigation<any>();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await addressesApi.getMyAddresses();
      setAddresses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Reload al volver de la pantalla de edición.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressesApi.setDefault(id);
      load();
    } catch (error: any) {
      Alert.alert(
        'No se pudo marcar',
        error?.response?.data?.message || 'Intenta de nuevo.',
      );
    }
  };

  const handleDelete = (a: Address) => {
    Alert.alert(
      'Eliminar dirección',
      `¿Seguro que quieres eliminar "${metaFor(a.label).display}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await addressesApi.delete(a.id);
              load();
            } catch (error: any) {
              Alert.alert(
                'No se pudo eliminar',
                error?.response?.data?.message || 'Intenta de nuevo.',
              );
            }
          },
        },
      ],
    );
  };

  const showOptions = (a: Address) => {
    const options: any[] = [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Editar',
        onPress: () =>
          navigation.navigate('AddressEdit', { addressId: a.id }),
      },
    ];
    if (!a.isDefault) {
      options.push({
        text: 'Marcar como predeterminada',
        onPress: () => handleSetDefault(a.id),
      });
    }
    options.push({
      text: 'Eliminar',
      style: 'destructive',
      onPress: () => handleDelete(a),
    });
    Alert.alert(metaFor(a.label).display, a.street, options);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>ENTREGAS</Text>
          <Text style={styles.headerTitle}>Mis direcciones</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ marginTop: s.xl }}
          />
        ) : addresses.length === 0 ? (
          <Card
            variant="glass"
            padding={s.xl}
            borderRadius={radius.xl}
            style={styles.empty}
          >
            <View style={styles.emptyHalo}>
              <Ionicons name="map" size={36} color={colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sin direcciones guardadas</Text>
            <Text style={styles.emptySub}>
              Agrega tu primera dirección para pedir más rápido. Puedes
              usar tu ubicación actual y editar lo que necesites.
            </Text>
          </Card>
        ) : (
          addresses.map((a) => {
            const meta = metaFor(a.label);
            return (
              <Card
                key={a.id}
                variant={a.isDefault ? 'raised' : 'glass'}
                padding={s.lg}
                borderRadius={radius.xl}
                onPress={() =>
                  navigation.navigate('AddressEdit', { addressId: a.id })
                }
                style={styles.row}
              >
                <View style={styles.rowIcon}>
                  <Ionicons
                    name={meta.icon}
                    size={20}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTitleRow}>
                    <Text style={styles.rowLabel} numberOfLines={1}>
                      {meta.display}
                    </Text>
                    {a.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={11}
                          color={colors.primary}
                        />
                        <Text style={styles.defaultBadgeText}>
                          POR DEFECTO
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rowStreet} numberOfLines={2}>
                    {a.street}
                    {a.apartment ? `, ${a.apartment}` : ''}
                  </Text>
                  {(a.city || a.zipCode) && (
                    <Text style={styles.rowCity} numberOfLines={1}>
                      {[a.city, a.zipCode].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                  {a.instructions && (
                    <Text style={styles.rowReference} numberOfLines={1}>
                      Ref: {a.instructions}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation?.();
                    showOptions(a);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.moreBtn}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* FAB nueva dirección */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={styles.fab}
        onPress={() => navigation.navigate('AddressEdit', { addressId: null })}
      >
        <Ionicons name="add" size={26} color={colors.onPrimary} />
        <Text style={styles.fabText}>NUEVA DIRECCIÓN</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

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
  headerTitle: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  scroll: {
    paddingHorizontal: s.xl,
    paddingBottom: 120,
    gap: s.sm,
  },

  empty: { alignItems: 'center', marginTop: s.lg },
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

  // ROW
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    marginBottom: s.sm,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    flexWrap: 'wrap',
  },
  rowLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.4)',
  },
  defaultBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.5,
  },
  rowStreet: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
    lineHeight: 18,
  },
  rowCity: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  rowReference: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    fontStyle: 'italic',
  },
  moreBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    left: s.xl,
    right: s.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  fabText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
});
