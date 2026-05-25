// ==========================================
// DEVOLÓN — Restaurant Menu
//
// Vista del catálogo desde el lado del DUEÑO del negocio. Roles claros:
//   • El restaurant SOLO ve productos aprobados por admin.
//   • El restaurant SOLO puede toggle disponibilidad (isAvailable) — útil
//     cuando se le acaba un platillo y quiere bajarlo temporalmente.
//   • El restaurant NO crea, NO edita precio/foto/nombre, NO elimina.
//   • Todo lo demás lo hace su editor asignado, y admin aprueba.
//
// Por eso esta pantalla es de "solo lectura" excepto el switch de
// disponibilidad. El empty state también es informativo, NO un CTA.
// ==========================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { productsApi } from '../../services/api';
import { Product } from '../../types';
import { Input, Card, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

export default function RestaurantMenuScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const loadProducts = useCallback(async () => {
    try {
      const data = await productsApi.getByRestaurant('my');
      // El restaurant SOLO ve productos aprobados. Cualquier producto
      // en revisión sigue siendo invisible para él (lo trabaja el editor).
      const approved = (data || []).filter((p: Product) => p.isApproved);
      setProducts(approved);
      const uniqueCategories = [
        ...new Set(approved.map((p: Product) => p.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts]),
  );

  const handleToggleAvailability = async (product: Product) => {
    try {
      await productsApi.toggleAvailability(product.id);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p,
        ),
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la disponibilidad');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(n ?? 0).toFixed(2)}`;
  };

  const renderProduct = ({ item: product }: { item: Product }) => (
    <Card
      variant="glass"
      padding={s.sm}
      borderRadius={radius.xl}
      style={styles.productCard}
    >
      <View style={styles.productMain}>
        <Image
          source={{ uri: product.image || 'https://via.placeholder.com/100' }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          {product.category && (
            <Text style={styles.productCategory} numberOfLines={1}>
              {product.category}
            </Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {formatCurrency(product.price)}
            </Text>
            {product.originalPrice &&
              product.originalPrice > product.price && (
                <Text style={styles.originalPrice}>
                  {formatCurrency(product.originalPrice)}
                </Text>
              )}
          </View>
        </View>
      </View>

      {/* Único control del dueño: toggle de disponibilidad. NO hay
          editar / eliminar — eso es responsabilidad del editor. */}
      <View style={styles.productFooter}>
        <View style={styles.availabilityRow}>
          <Switch
            value={product.isAvailable}
            onValueChange={() => handleToggleAvailability(product)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
          <Text
            style={[
              styles.availabilityText,
              {
                color: product.isAvailable ? colors.success : colors.textMuted,
              },
            ]}
          >
            {product.isAvailable ? 'Disponible' : 'Agotado'}
          </Text>
        </View>
        <View style={styles.lockedHint}>
          <Ionicons name="lock-closed" size={11} color={colors.textFaint} />
          <Text style={styles.lockedHintText}>
            Edita con tu editor
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ============ HEADER (sin botón +) ============ */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DEVOLÓN · CATÁLOGO</Text>
        <Text style={styles.title}>Mi menú</Text>
      </View>

      {/* ============ SEARCH ============ */}
      <View style={styles.searchWrap}>
        <Input
          variant="filled"
          icon="search"
          placeholder="Buscar productos…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          rightIcon={searchQuery ? 'close-circle' : undefined}
          onRightIconPress={() => setSearchQuery('')}
        />
      </View>

      {/* ============ CATEGORIES ============ */}
      {categories.length > 0 && (
        <View style={styles.categoriesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['Todos', ...categories]}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }) => {
              const active =
                item === 'Todos'
                  ? !selectedCategory
                  : selectedCategory === item;
              return (
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    active && styles.categoryChipActive,
                  ]}
                  onPress={() =>
                    setSelectedCategory(item === 'Todos' ? null : item)
                  }
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      active && styles.categoryChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ============ COUNT ============ */}
      {filteredProducts.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {filteredProducts.length} producto
            {filteredProducts.length === 1 ? '' : 's'} aprobado
            {filteredProducts.length === 1 ? '' : 's'}
          </Text>
        </View>
      )}

      {/* ============ PRODUCTS ============ */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="restaurant-outline"
            title="Tu carta está en preparación"
            subtitle="Tu editor está cargando los productos. Te avisaremos cuando tu menú esté listo para recibir pedidos."
          />
        }
        ListFooterComponent={
          filteredProducts.length > 0 ? (
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.infoBanner}
            >
              <View style={styles.infoHalo}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={colors.primary}
                />
              </View>
              <Text style={styles.infoText}>
                Para cambiar precios, fotos o agregar productos nuevos, contacta
                a tu editor desde el chat.
              </Text>
            </Card>
          ) : null
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

  // ============ SEARCH ============
  searchWrap: {
    paddingHorizontal: s.xl,
    paddingBottom: s.sm,
  },

  // ============ CATEGORIES ============
  categoriesContainer: { paddingTop: s.xs },
  categoriesList: { paddingHorizontal: s.xl, gap: s.xs },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.md,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: s.xs,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  categoryChipTextActive: { color: colors.primary },

  // ============ COUNT ============
  countContainer: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.sm,
  },
  countText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
    flexGrow: 1,
  },

  // ============ PRODUCT CARD ============
  productCard: { marginBottom: s.sm },
  productMain: {
    flexDirection: 'row',
    gap: s.sm,
  },
  productImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.bgRaised,
  },
  productInfo: { flex: 1, justifyContent: 'center' },
  productName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  productCategory: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: s.xs,
    marginTop: 4,
  },
  productPrice: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  originalPrice: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textDecorationLine: 'line-through',
  },

  // ============ PRODUCT FOOTER ============
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s.sm,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  availabilityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  lockedHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lockedHintText: {
    color: colors.textFaint,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    textTransform: 'uppercase',
  },

  // ============ INFO BANNER ============
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginTop: s.lg,
  },
  infoHalo: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },
});
