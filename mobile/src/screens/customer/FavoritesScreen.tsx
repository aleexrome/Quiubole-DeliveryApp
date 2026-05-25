// ==========================================
// DEVOLÓN — Customer Favorites
//
// Tabs (Todos / Listas), cards glass con logo + meta, modales premium
// para crear lista y agregar a lista existente.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFavoritesStore } from '../../store/favoritesStore';
import { Restaurant } from '../../types';
import { Screen, Header, Card, Input, Button, EmptyState } from '../../components/ui';
import { colors, s, radius, shadows, fontSize, fontWeight, tracking } from '../../theme';

const MOCK_RESTAURANTS: Record<string, Partial<Restaurant>> = {
  '1': { id: '1', name: 'Tacos El Patrón', category: 'Tacos', rating: 4.8, logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', deliveryTime: '20-30 min' },
  '2': { id: '2', name: 'Pizza Napoli', category: 'Pizza', rating: 4.6, logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', deliveryTime: '30-45 min' },
  '3': { id: '3', name: 'Burger Master', category: 'Hamburguesas', rating: 4.5, logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', deliveryTime: '25-35 min' },
  '4': { id: '4', name: 'Sushi Sakura', category: 'Sushi', rating: 4.9, logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', deliveryTime: '35-50 min' },
};

const EMOJI_OPTIONS = ['📁', '😋', '🎉', '🥗', '🍕', '🌮', '🍔', '🍣', '☕', '🍰', '🥤', '💼'];

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { favorites, lists, toggleFavorite, createList, deleteList, addToList } = useFavoritesStore();

  const [activeTab, setActiveTab] = useState<'all' | 'lists'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📁');

  const favoriteRestaurants = favorites.map((id) => MOCK_RESTAURANTS[id]).filter(Boolean);

  const handleRemoveFavorite = (restaurantId: string) => {
    Alert.alert('Eliminar de favoritos', '¿Quieres eliminar este restaurante de favoritos?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => toggleFavorite(restaurantId) },
    ]);
  };

  const handleCreateList = () => {
    if (newListName.trim()) {
      createList(newListName.trim(), newListIcon);
      setNewListName('');
      setNewListIcon('📁');
      setShowCreateModal(false);
    }
  };

  const handleDeleteList = (listId: string) => {
    if (listId.startsWith('default-')) {
      Alert.alert('No permitido', 'No puedes eliminar las listas predeterminadas.');
      return;
    }
    Alert.alert('Eliminar lista', '¿Quieres eliminar esta lista?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteList(listId) },
    ]);
  };

  const renderRestaurant = ({ item }: { item: Partial<Restaurant> }) => (
    <Card
      variant="glass"
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      padding={s.sm}
      borderRadius={radius.lg}
      style={styles.row}
    >
      <Image source={{ uri: item.logo }} style={styles.logo} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowCategory}>{item.category}</Text>
        <View style={styles.rowMeta}>
          <Ionicons name="star" size={11} color={colors.primary} />
          <Text style={styles.rowRating}>{item.rating}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.deliveryTime}>{item.deliveryTime}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            setSelectedRestaurant(item.id!);
            setShowAddToListModal(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="folder-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleRemoveFavorite(item.id!)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="heart" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderList = ({ item }: { item: typeof lists[0] }) => {
    const listRestaurants = item.restaurantIds.map((id) => MOCK_RESTAURANTS[id]).filter(Boolean);
    return (
      <Card
        variant="glass"
        onPress={() => navigation.navigate('ListDetail', { list: item })}
        padding={s.md}
        borderRadius={radius.xl}
        style={styles.listCard}
      >
        <View style={styles.listIconHalo}>
          <Text style={styles.listEmoji}>{item.icon}</Text>
        </View>
        <View style={styles.listBody}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listCount}>{item.restaurantIds.length} restaurantes</Text>
        </View>
        <View style={styles.listPreview}>
          {listRestaurants.slice(0, 3).map((r, i) => (
            <Image
              key={r?.id}
              source={{ uri: r?.logo }}
              style={[styles.previewImg, { marginLeft: i > 0 ? -10 : 0 }]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => handleDeleteList(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <Screen padded={false}>
      <Header
        title="Favoritos"
        eyebrow="MI COLECCIÓN"
        rightIcon="add-circle-outline"
        onRightPress={() => setShowCreateModal(true)}
      />

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            TODOS · {favorites.length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lists' && styles.tabActive]}
          onPress={() => setActiveTab('lists')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, activeTab === 'lists' && styles.tabTextActive]}>
            LISTAS · {lists.length}
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'all' ? (
        <FlatList
          data={favoriteRestaurants}
          keyExtractor={(item) => item?.id || ''}
          renderItem={renderRestaurant}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="Sin favoritos"
              subtitle="Guarda tus restaurantes favoritos para encontrarlos rápido."
            />
          }
        />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderList}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState
              icon="folder-open-outline"
              title="Sin listas"
              subtitle="Crea listas para organizar tus restaurantes."
              actionLabel="CREAR LISTA"
              onAction={() => setShowCreateModal(true)}
            />
          }
        />
      )}

      {/* Create List Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>NUEVA</Text>
            <Text style={styles.modalTitle}>Crear lista</Text>

            <View style={{ marginTop: s.lg }}>
              <Input
                variant="filled"
                label="Nombre"
                placeholder="Ej: Comida mexicana"
                value={newListName}
                onChangeText={setNewListName}
                maxLength={30}
              />
            </View>

            <Text style={styles.modalSubLabel}>ÍCONO</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiOption, newListIcon === emoji && styles.emojiSelected]}
                  onPress={() => setNewListIcon(emoji)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <Button
                label="CANCELAR"
                variant="secondary"
                size="md"
                onPress={() => setShowCreateModal(false)}
              />
              <Button label="CREAR" variant="primary" size="md" onPress={handleCreateList} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Add to List Modal */}
      <Modal visible={showAddToListModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalEyebrow}>AGREGAR A</Text>
            <Text style={styles.modalTitle}>Elige una lista</Text>

            <ScrollView style={{ maxHeight: 320, marginTop: s.lg }}>
              {lists.map((list) => {
                const included =
                  selectedRestaurant && list.restaurantIds.includes(selectedRestaurant);
                return (
                  <TouchableOpacity
                    key={list.id}
                    style={styles.listOption}
                    onPress={() => {
                      if (selectedRestaurant) {
                        addToList(list.id, selectedRestaurant);
                        setShowAddToListModal(false);
                        Alert.alert('Agregado', `Agregado a "${list.name}".`);
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.listOptionEmoji}>{list.icon}</Text>
                    <Text style={styles.listOptionName}>{list.name}</Text>
                    {included && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginTop: s.lg }}>
              <Button
                label="CERRAR"
                variant="secondary"
                size="md"
                onPress={() => setShowAddToListModal(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: s.xl,
    gap: s.sm,
    marginBottom: s.md,
  },
  tab: {
    flex: 1,
    paddingVertical: s.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,194,14,0.1)',
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  tabTextActive: { color: colors.primary },

  listContent: {
    paddingHorizontal: s.xl,
    paddingBottom: s['3xl'],
    gap: s.xs,
    flexGrow: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  logo: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
  },
  rowBody: { flex: 1 },
  rowName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  rowCategory: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rowRating: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    marginLeft: 3,
  },
  dot: { color: colors.textFaint, fontSize: fontSize.xs },
  deliveryTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  actions: { flexDirection: 'row', gap: s.xs },
  actionBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  listIconHalo: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listEmoji: { fontSize: 24 },
  listBody: { flex: 1 },
  listName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  listCount: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  listPreview: {
    flexDirection: 'row',
  },
  previewImg: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.bg,
  },

  // ============ MODALS ============
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.bgRaised,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: s.xl,
    paddingTop: s.xl,
    paddingBottom: s['2xl'],
    ...shadows.lg,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  modalSubLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginTop: s.lg,
    marginBottom: s.xs,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiSelected: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  emoji: { fontSize: 22 },
  modalActions: {
    flexDirection: 'row',
    gap: s.sm,
    marginTop: s.xl,
  },

  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: s.sm,
  },
  listOptionEmoji: { fontSize: 22 },
  listOptionName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
