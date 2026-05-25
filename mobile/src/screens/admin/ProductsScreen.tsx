// ==========================================
// DEVOLÓN — Admin Products
//
// Sub-pantalla del stack. Productos globales con filtros, búsqueda y
// edición de precio/descripción/imagen vía modal bottom-sheet dark.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/api';
import { Product } from '../../types';
import { Card, Header, Input, Button, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type ProductsStats = { all: number; approved: number; pending: number };
const EMPTY_P_STATS: ProductsStats = { all: 0, approved: 0, pending: 0 };

export default function AdminProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<ProductsStats>(EMPTY_P_STATS);
  const [filter, setFilter] = useState<'pending' | 'all' | 'approved'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editedPrice, setEditedPrice] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
    loadStats();
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
      loadStats();
    }, [filter]),
  );

  const loadProducts = async () => {
    try {
      const data = await adminApi.getProducts({ status: filter });
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getProductsStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading products stats:', error);
    }
  };

  const handleApprove = async (product: Product) => {
    Alert.alert('Aprobar producto', `¿Aprobar "${product.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Aprobar',
        onPress: async () => {
          try {
            await adminApi.approveProduct(product.id);
            loadProducts();
            Alert.alert('Éxito', 'Producto aprobado');
          } catch (error) {
            Alert.alert('Error', 'No se pudo aprobar el producto');
          }
        },
      },
    ]);
  };

  const handleReject = async (product: Product) => {
    Alert.prompt(
      'Rechazar producto',
      '¿Por qué rechazas este producto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await adminApi.rejectProduct(
                product.id,
                reason || 'No cumple requisitos',
              );
              loadProducts();
              Alert.alert('Producto rechazado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar el producto');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default',
    );
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setEditedPrice(product.price.toString());
    setEditedDescription(product.description);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedProduct) return;
    setSaving(true);
    try {
      await adminApi.updateProduct(selectedProduct.id, {
        price: parseFloat(editedPrice),
        description: editedDescription,
      });
      setEditModalVisible(false);
      loadProducts();
      Alert.alert('Éxito', 'Producto actualizado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el producto');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(n ?? 0).toFixed(2)}`;
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderProduct = ({ item: product }: { item: Product }) => (
    <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
      <View style={styles.productRow}>
        <Image
          source={{
            uri: product.image || 'https://via.placeholder.com/100',
          }}
          style={styles.productImage}
        />
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName} numberOfLines={1}>
              {product.name}
            </Text>
            <View
              style={[
                styles.statusBadge,
                product.isApproved
                  ? styles.statusApproved
                  : styles.statusPending,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color: product.isApproved
                      ? colors.success
                      : colors.primary,
                  },
                ]}
              >
                {product.isApproved ? 'Aprobado' : 'Pendiente'}
              </Text>
            </View>
          </View>
          <Text style={styles.restaurantName}>Restaurante</Text>
          <Text style={styles.productDescription} numberOfLines={2}>
            {product.description}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>
              {formatCurrency(product.price)}
            </Text>
            {product.originalPrice && product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>
                {formatCurrency(product.originalPrice)}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* ACTIONS */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => openEditModal(product)}
          activeOpacity={0.85}
        >
          <Ionicons name="pencil" size={14} color={colors.primary} />
          <Text style={styles.editBtnText}>EDITAR</Text>
        </TouchableOpacity>

        {!product.isApproved && (
          <>
            <TouchableOpacity
              style={styles.rejectBtn}
              onPress={() => handleReject(product)}
              activeOpacity={0.85}
            >
              <Ionicons name="close" size={14} color={colors.danger} />
              <Text style={styles.rejectBtnText}>RECHAZAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.approveBtn}
              onPress={() => handleApprove(product)}
              activeOpacity={0.85}
            >
              <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
              <Text style={styles.approveBtnText}>APROBAR</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header eyebrow="DEVOLÓN · ADMIN" title="Productos" />

      {/* INFO BANNER */}
      <View style={{ paddingHorizontal: s.xl, paddingBottom: s.md }}>
        <Card
          variant="glass"
          padding={s.md}
          borderRadius={radius.lg}
          style={styles.infoBanner}
        >
          <Ionicons
            name="information-circle"
            size={18}
            color={colors.primary}
          />
          <Text style={styles.infoText}>
            Puedes editar precios, descripciones e imágenes de todos los
            productos para mantener la calidad.
          </Text>
        </Card>
      </View>

      {/* SEARCH */}
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

      {/* KPIs grandes */}
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

      {/* FILTERS — pills con count badge */}
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
        data={filteredProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: s.sm }} />}
        ListEmptyComponent={
          <EmptyState
            icon="checkmark-circle-outline"
            title="Sin productos"
            subtitle="No hay productos para este filtro."
          />
        }
      />

      {/* EDIT MODAL */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalEyebrow}>EDITAR</Text>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedProduct?.name || 'Producto'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedProduct && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Image
                  source={{
                    uri:
                      selectedProduct.image ||
                      'https://via.placeholder.com/200',
                  }}
                  style={styles.modalImage}
                />

                <TouchableOpacity
                  style={styles.changeImageBtn}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera" size={18} color={colors.primary} />
                  <Text style={styles.changeImageText}>Cambiar imagen</Text>
                </TouchableOpacity>

                <View style={{ marginTop: s.md }}>
                  <Input
                    variant="filled"
                    label="PRECIO"
                    value={editedPrice}
                    onChangeText={setEditedPrice}
                    keyboardType="decimal-pad"
                    icon="cash-outline"
                  />
                </View>

                <View style={{ marginTop: s.md }}>
                  <Text style={styles.fieldLabel}>DESCRIPCIÓN</Text>
                  <View style={styles.textAreaWrap}>
                    <TextInput
                      style={styles.textArea}
                      value={editedDescription}
                      onChangeText={setEditedDescription}
                      placeholder="Descripción…"
                      placeholderTextColor={colors.textFaint}
                      multiline
                      numberOfLines={4}
                      selectionColor={colors.primary}
                    />
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Cancelar"
                      variant="secondary"
                      size="md"
                      onPress={() => setEditModalVisible(false)}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Guardar"
                      variant="primary"
                      size="md"
                      onPress={handleSaveEdit}
                      loading={saving}
                    />
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ INFO BANNER ============
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    borderColor: 'rgba(255,194,14,0.25)',
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
  },

  // ============ SEARCH ============
  searchWrap: {
    paddingHorizontal: s.xl,
    paddingBottom: s.sm,
  },

  // ============ FILTERS ============
  // ============ STATS (KPI cards) ============
  statsWrap: {
    flexDirection: 'row',
    gap: s.xs,
    paddingHorizontal: s.xl,
    paddingBottom: s.md,
  },
  statCard: { flex: 1, alignItems: 'flex-start' },
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

  // ============ FILTERS ============
  filtersScroll: { flexGrow: 0 },
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
    // Altura FIJA evita que la pill activa se estire verticalmente por
    // algún quirk del cross-axis del ScrollView horizontal. Antes con
    // solo paddingVertical, la pill seleccionada se veía mucho más alta
    // que las otras.
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

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
  },
  productRow: {
    flexDirection: 'row',
    gap: s.sm,
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  productInfo: { flex: 1 },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: s.xs,
  },
  productName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  statusApproved: { backgroundColor: 'rgba(31,174,111,0.12)' },
  statusPending: { backgroundColor: 'rgba(255,194,14,0.12)' },
  statusText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  restaurantName: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  productDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 4,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  productPrice: {
    color: colors.primary,
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

  // ============ ACTIONS ============
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
    marginTop: s.sm,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: s.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    backgroundColor: 'rgba(255,194,14,0.08)',
  },
  editBtnText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: s.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: s.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  approveBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 1.2,
  },

  // ============ MODAL ============
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgRaised,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: s.lg,
    paddingTop: s.sm,
    paddingBottom: s.xl,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: s.sm,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s.md,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  modalImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  changeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: s.sm,
    marginTop: s.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,194,14,0.04)',
  },
  changeImageText: {
    color: colors.primary,
    fontWeight: fontWeight.heavy,
    fontSize: fontSize.sm,
    letterSpacing: 0.3,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
    marginBottom: s.xs,
  },
  textAreaWrap: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
  },
  textArea: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.lg,
  },
});
