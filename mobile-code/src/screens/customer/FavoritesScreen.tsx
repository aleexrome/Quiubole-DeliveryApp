// ==========================================
// FAVORITES SCREEN - RESTAURANTES FAVORITOS
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
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFavoritesStore } from '../../store/favoritesStore';
import { Restaurant } from '../../types';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  star: '#FFD700',
  danger: '#F44336',
};

// Mock de restaurantes favoritos
const MOCK_RESTAURANTS: Record<string, Partial<Restaurant>> = {
  '1': { id: '1', name: 'Tacos El Patron', category: 'Tacos', rating: 4.8, logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200', deliveryTime: '20-30 min' },
  '2': { id: '2', name: 'Pizza Napoli', category: 'Pizza', rating: 4.6, logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200', deliveryTime: '30-45 min' },
  '3': { id: '3', name: 'Burger Master', category: 'Hamburguesas', rating: 4.5, logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200', deliveryTime: '25-35 min' },
  '4': { id: '4', name: 'Sushi Sakura', category: 'Sushi', rating: 4.9, logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200', deliveryTime: '35-50 min' },
};

const EMOJI_OPTIONS = ['📁', '😋', '🎉', '🥗', '🍕', '🌮', '🍔', '🍣', '☕', '🍰', '🥤', '💼'];

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { favorites, lists, toggleFavorite, createList, deleteList, addToList, removeFromList } = useFavoritesStore();

  const [activeTab, setActiveTab] = useState<'all' | 'lists'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddToListModal, setShowAddToListModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📁');

  const favoriteRestaurants = favorites.map(id => MOCK_RESTAURANTS[id]).filter(Boolean);

  const handleRestaurantPress = (restaurant: Partial<Restaurant>) => {
    navigation.navigate('RestaurantDetail', { restaurant });
  };

  const handleRemoveFavorite = (restaurantId: string) => {
    Alert.alert(
      'Eliminar de favoritos',
      'Quieres eliminar este restaurante de tus favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => toggleFavorite(restaurantId) },
      ]
    );
  };

  const handleAddToList = (restaurantId: string) => {
    setSelectedRestaurant(restaurantId);
    setShowAddToListModal(true);
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
      Alert.alert('No permitido', 'No puedes eliminar las listas predeterminadas');
      return;
    }
    Alert.alert(
      'Eliminar lista',
      'Quieres eliminar esta lista?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteList(listId) },
      ]
    );
  };

  const renderRestaurantItem = ({ item }: { item: Partial<Restaurant> }) => (
    <TouchableOpacity style={styles.restaurantCard} onPress={() => handleRestaurantPress(item)}>
      <Image source={{ uri: item.logo }} style={styles.restaurantImage} />
      <View style={styles.restaurantInfo}>
        <Text style={styles.restaurantName}>{item.name}</Text>
        <Text style={styles.restaurantCategory}>{item.category}</Text>
        <View style={styles.restaurantMeta}>
          <Ionicons name="star" size={12} color={COLORS.star} />
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.deliveryTime}> • {item.deliveryTime}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleAddToList(item.id!)}>
          <Ionicons name="folder-outline" size={20} color={COLORS.gray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleRemoveFavorite(item.id!)}>
          <Ionicons name="heart" size={20} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: typeof lists[0] }) => {
    const listRestaurants = item.restaurantIds.map(id => MOCK_RESTAURANTS[id]).filter(Boolean);
    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => navigation.navigate('ListDetail', { list: item })}
      >
        <View style={styles.listIcon}>
          <Text style={styles.listEmoji}>{item.icon}</Text>
        </View>
        <View style={styles.listInfo}>
          <Text style={styles.listName}>{item.name}</Text>
          <Text style={styles.listCount}>{item.restaurantIds.length} restaurantes</Text>
        </View>
        <View style={styles.listPreview}>
          {listRestaurants.slice(0, 3).map((r, i) => (
            <Image
              key={r?.id}
              source={{ uri: r?.logo }}
              style={[styles.previewImage, { marginLeft: i > 0 ? -10 : 0 }]}
            />
          ))}
        </View>
        <TouchableOpacity onPress={() => handleDeleteList(item.id)}>
          <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add-circle-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            Todos ({favorites.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lists' && styles.tabActive]}
          onPress={() => setActiveTab('lists')}
        >
          <Text style={[styles.tabText, activeTab === 'lists' && styles.tabTextActive]}>
            Listas ({lists.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'all' ? (
        <FlatList
          data={favoriteRestaurants}
          keyExtractor={item => item?.id || ''}
          renderItem={renderRestaurantItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="heart-outline" size={64} color={COLORS.lightGray} />
              <Text style={styles.emptyTitle}>Sin favoritos</Text>
              <Text style={styles.emptySubtitle}>
                Guarda tus restaurantes favoritos para encontrarlos rapido
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={lists}
          keyExtractor={item => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Create List Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva lista</Text>

            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Comida mexicana"
              value={newListName}
              onChangeText={setNewListName}
              maxLength={30}
            />

            <Text style={styles.inputLabel}>Icono</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={[styles.emojiOption, newListIcon === emoji && styles.emojiSelected]}
                  onPress={() => setNewListIcon(emoji)}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateList}>
                <Text style={styles.createText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add to List Modal */}
      <Modal visible={showAddToListModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar a lista</Text>
            <ScrollView style={styles.listOptions}>
              {lists.map(list => (
                <TouchableOpacity
                  key={list.id}
                  style={styles.listOption}
                  onPress={() => {
                    if (selectedRestaurant) {
                      addToList(list.id, selectedRestaurant);
                      setShowAddToListModal(false);
                      Alert.alert('Agregado', `Agregado a "${list.name}"`);
                    }
                  }}
                >
                  <Text style={styles.listOptionEmoji}>{list.icon}</Text>
                  <Text style={styles.listOptionName}>{list.name}</Text>
                  {selectedRestaurant && list.restaurantIds.includes(selectedRestaurant) && (
                    <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowAddToListModal(false)}
            >
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.white, paddingHorizontal: 16 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.primary },
  listContent: { padding: 16 },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  restaurantImage: { width: 60, height: 60, borderRadius: 30 },
  restaurantInfo: { flex: 1, marginLeft: 12 },
  restaurantName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  restaurantCategory: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  restaurantMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  rating: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginLeft: 4 },
  deliveryTime: { fontSize: 12, color: COLORS.gray },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 8 },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  listIcon: { width: 50, height: 50, borderRadius: 12, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  listEmoji: { fontSize: 24 },
  listInfo: { flex: 1, marginLeft: 12 },
  listName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  listCount: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  listPreview: { flexDirection: 'row', marginRight: 12 },
  previewImage: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.white },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  emojiOption: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center' },
  emojiSelected: { backgroundColor: COLORS.primary },
  emoji: { fontSize: 22 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.lightGray, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600', color: COLORS.gray },
  createButton: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  createText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  listOptions: { maxHeight: 300 },
  listOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.lightGray },
  listOptionEmoji: { fontSize: 24, marginRight: 12 },
  listOptionName: { flex: 1, fontSize: 15, color: COLORS.text },
});
