// ==========================================
// DEVOLÓN — Editor / Menú del restaurante
//
// Sub-screen del stack del editor (header nativo dark). Lista los
// productos del restaurante seleccionado en cards glass con thumb,
// nombre, descripción y precio. FAB amarillo con glow para crear
// producto. El header nativo lleva el nombre del restaurante + acción
// de "settings" para saltar a editar la info del restaurante.
// ==========================================

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import { productsApi } from '../../services/api';
import { Product } from '../../types';
import { Card, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

export default function EditorMenuScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId, restaurantName } = route.params || {};

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      // Usamos el endpoint "managed" que incluye productos en revisión
      // (isApproved=false) y los marcados no-disponibles por el dueño.
      // El editor necesita ver TODA su carta para gestionarla.
      const data = await productsApi.getManagedByRestaurant(restaurantId);
      setProducts(data);
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'No se pudo cargar el menú',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [restaurantId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Header nativo dinámico con el nombre del restaurante + acción
  // "settings" para saltar a editar la info del restaurante.
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: restaurantName || 'Menú',
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('EditorRestaurantEdit', { restaurantId })
          }
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerAction}
        >
          <Ionicons name="settings-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, restaurantName, restaurantId]);

  const formatPrice = (p: any) => `$${Number(p).toFixed(2)}`;

  const renderItem = ({ item }: { item: Product }) => {
    const available = (item as any).isAvailable ?? true;
    // Backend devuelve isApproved=false en productos creados/editados por
    // editor hasta que admin los aprueba. Pintamos un chip amarillo claro
    // para que el editor sepa que está esperando validación del admin.
    const pendingApproval = (item as any).isApproved === false;

    return (
      <Card
        variant="glass"
        onPress={() =>
          navigation.navigate('EditorProductEdit', {
            restaurantId,
            productId: item.id,
          })
        }
        padding={s.sm}
        borderRadius={radius.xl}
        style={styles.card}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.desc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            {pendingApproval && (
              <View style={styles.pendingBadge}>
                <Ionicons name="time" size={10} color={colors.primary} />
                <Text style={styles.pendingText}>EN REVISIÓN</Text>
              </View>
            )}
            {!available && (
              <View style={styles.disabledBadge}>
                <View style={styles.disabledDot} />
                <Text style={styles.disabledText}>No disponible</Text>
              </View>
            )}
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: s.xs }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListHeaderComponent={
          <View style={styles.counter}>
            <Text style={styles.counterEyebrow}>MENÚ</Text>
            <Text style={styles.counterText}>
              {products.length} producto{products.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="pizza-outline"
            title="Menú vacío"
            subtitle="Agrega el primer producto con el botón de abajo."
          />
        }
      />

      {/* FAB crear producto */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('EditorProductEdit', {
            restaurantId,
            productId: null,
          })
        }
      >
        <Ionicons name="add" size={28} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
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

  // ============ HEADER ACTION ============
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s.xs,
  },

  // ============ LIST ============
  listContent: {
    padding: s.xl,
    paddingBottom: 120,
    flexGrow: 1,
  },
  counter: {
    marginBottom: s.md,
  },
  counterEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  counterText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },

  // ============ CARD ============
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
  },
  thumbPlaceholder: {
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  desc: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    marginTop: 6,
  },
  price: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  // Chip "EN REVISIÓN" — productos sin aprobar por admin.
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.4)',
  },
  pendingText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
  },
  disabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.32)',
  },
  disabledDot: {
    width: 5,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
  },
  disabledText: {
    color: colors.danger,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase',
  },

  // ============ FAB ============
  fab: {
    position: 'absolute',
    right: s.xl,
    bottom: s.xl,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
});
