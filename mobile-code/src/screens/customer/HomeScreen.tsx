// ==========================================
// HOME SCREEN - CLIENTE
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Restaurant } from '../../types';
import { restaurantsApi } from '../../services/api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;

// Colores de la marca
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  textLight: '#6C757D',
  success: '#4CAF50',
  star: '#FFD700',
};

// Categorias de restaurantes
const CATEGORIES = [
  { id: '1', name: 'Tacos', icon: '🌮' },
  { id: '2', name: 'Pizza', icon: '🍕' },
  { id: '3', name: 'Hamburguesas', icon: '🍔' },
  { id: '4', name: 'Sushi', icon: '🍣' },
  { id: '5', name: 'Pollos', icon: '🍗' },
  { id: '6', name: 'Mariscos', icon: '🦐' },
  { id: '7', name: 'Postres', icon: '🍰' },
  { id: '8', name: 'Bebidas', icon: '🥤' },
  { id: '9', name: 'Saludable', icon: '🥗' },
  { id: '10', name: 'Desayunos', icon: '🍳' },
];

// Datos mock de restaurantes (se reemplazara con API)
const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    ownerId: '1',
    name: 'Tacos El Patron',
    description: 'Los mejores tacos de la ciudad con recetas tradicionales',
    logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    coverImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    address: { id: '1', label: 'Local', street: 'Av. Revolucion', number: '123', neighborhood: 'Centro', city: 'CDMX', state: 'CDMX', zipCode: '06000', location: { latitude: 19.4326, longitude: -99.1332 }, isDefault: true },
    phone: '555-123-4567',
    email: 'tacos@patron.com',
    category: 'Tacos',
    rating: 4.8,
    totalReviews: 234,
    isActive: true,
    isApproved: true,
    openingHours: [],
    deliveryTime: '20-30 min',
    deliveryFee: 25,
    minimumOrder: 80,
    createdAt: new Date(),
  },
  {
    id: '2',
    ownerId: '2',
    name: 'Pizza Napoli',
    description: 'Autentica pizza italiana con ingredientes importados',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    coverImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    address: { id: '2', label: 'Local', street: 'Calle Roma', number: '456', neighborhood: 'Roma Norte', city: 'CDMX', state: 'CDMX', zipCode: '06700', location: { latitude: 19.4200, longitude: -99.1600 }, isDefault: true },
    phone: '555-987-6543',
    email: 'pizza@napoli.com',
    category: 'Pizza',
    rating: 4.6,
    totalReviews: 189,
    isActive: true,
    isApproved: true,
    openingHours: [],
    deliveryTime: '30-45 min',
    deliveryFee: 30,
    minimumOrder: 150,
    createdAt: new Date(),
  },
  {
    id: '3',
    ownerId: '3',
    name: 'Burger Master',
    description: 'Hamburguesas artesanales con carne Angus',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
    coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    address: { id: '3', label: 'Local', street: 'Av. Insurgentes', number: '789', neighborhood: 'Del Valle', city: 'CDMX', state: 'CDMX', zipCode: '03100', location: { latitude: 19.3800, longitude: -99.1700 }, isDefault: true },
    phone: '555-456-7890',
    email: 'info@burgermaster.com',
    category: 'Hamburguesas',
    rating: 4.5,
    totalReviews: 312,
    isActive: true,
    isApproved: true,
    openingHours: [],
    deliveryTime: '25-35 min',
    deliveryFee: 20,
    minimumOrder: 100,
    createdAt: new Date(),
  },
  {
    id: '4',
    ownerId: '4',
    name: 'Sushi Sakura',
    description: 'El mejor sushi japones con pescado fresco diario',
    logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200',
    coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    address: { id: '4', label: 'Local', street: 'Calle Polanco', number: '321', neighborhood: 'Polanco', city: 'CDMX', state: 'CDMX', zipCode: '11550', location: { latitude: 19.4350, longitude: -99.1900 }, isDefault: true },
    phone: '555-321-0987',
    email: 'sushi@sakura.com',
    category: 'Sushi',
    rating: 4.9,
    totalReviews: 156,
    isActive: true,
    isApproved: true,
    openingHours: [],
    deliveryTime: '35-50 min',
    deliveryFee: 40,
    minimumOrder: 200,
    createdAt: new Date(),
  },
];

// Componente de categoria
const CategoryItem = ({ category, onPress }: { category: typeof CATEGORIES[0]; onPress: () => void }) => (
  <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
    <View style={styles.categoryIcon}>
      <Text style={styles.categoryEmoji}>{category.icon}</Text>
    </View>
    <Text style={styles.categoryName}>{category.name}</Text>
  </TouchableOpacity>
);

// Componente de restaurante destacado (horizontal)
const FeaturedRestaurantCard = ({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) => (
  <TouchableOpacity style={styles.featuredCard} onPress={onPress}>
    <Image source={{ uri: restaurant.coverImage }} style={styles.featuredImage} />
    <View style={styles.featuredOverlay}>
      <View style={styles.featuredBadge}>
        <Ionicons name="star" size={12} color={COLORS.star} />
        <Text style={styles.featuredRating}>{restaurant.rating}</Text>
      </View>
    </View>
    <View style={styles.featuredInfo}>
      <Text style={styles.featuredName} numberOfLines={1}>{restaurant.name}</Text>
      <Text style={styles.featuredCategory}>{restaurant.category}</Text>
      <View style={styles.featuredMeta}>
        <Ionicons name="time-outline" size={12} color={COLORS.gray} />
        <Text style={styles.featuredMetaText}>{restaurant.deliveryTime}</Text>
        <Text style={styles.featuredDot}>•</Text>
        <Text style={styles.featuredMetaText}>Envio ${restaurant.deliveryFee}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// Componente de restaurante (lista vertical)
const RestaurantCard = ({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) => (
  <TouchableOpacity style={styles.restaurantCard} onPress={onPress}>
    <Image source={{ uri: restaurant.logo }} style={styles.restaurantImage} />
    <View style={styles.restaurantInfo}>
      <View style={styles.restaurantHeader}>
        <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={COLORS.star} />
          <Text style={styles.ratingText}>{restaurant.rating}</Text>
        </View>
      </View>
      <Text style={styles.restaurantCategory}>{restaurant.category}</Text>
      <Text style={styles.restaurantDescription} numberOfLines={2}>
        {restaurant.description}
      </Text>
      <View style={styles.restaurantMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={COLORS.gray} />
          <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="bicycle-outline" size={14} color={COLORS.gray} />
          <Text style={styles.metaText}>${restaurant.deliveryFee}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="cart-outline" size={14} color={COLORS.gray} />
          <Text style={styles.metaText}>Min ${restaurant.minimumOrder}</Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { itemCount } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(MOCK_RESTAURANTS);
  const [featuredRestaurants, setFeaturedRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRestaurants();
  }, []);

  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      // TODO: Reemplazar con llamada a API real
      // const response = await restaurantsApi.getAll();
      // setRestaurants(response.data);

      // Por ahora usar datos mock
      setRestaurants(MOCK_RESTAURANTS);
      setFeaturedRestaurants(MOCK_RESTAURANTS.filter(r => r.rating >= 4.7));
    } catch (error) {
      console.error('Error loading restaurants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRestaurants();
    setRefreshing(false);
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      setRestaurants(MOCK_RESTAURANTS);
    } else {
      setSelectedCategory(categoryId);
      setRestaurants(MOCK_RESTAURANTS.filter(r => r.category === categoryName));
    }
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetail', { restaurant });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const filtered = MOCK_RESTAURANTS.filter(r =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setRestaurants(filtered);
    } else {
      setRestaurants(MOCK_RESTAURANTS);
    }
  };

  const handleChatbotPress = () => {
    navigation.navigate('Chatbot');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0] || 'Usuario'}</Text>
          <TouchableOpacity style={styles.addressButton}>
            <Ionicons name="location" size={16} color={COLORS.primary} />
            <Text style={styles.addressText} numberOfLines={1}>Seleccionar direccion</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={handleChatbotPress}>
            <Ionicons name="chatbubble-ellipses" size={24} color={COLORS.secondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart" size={24} color={COLORS.secondary} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar restaurantes o platillos..."
            placeholderTextColor={COLORS.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setRestaurants(MOCK_RESTAURANTS); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        {/* Quiu Banner */}
        <TouchableOpacity style={styles.quiuBanner} onPress={handleChatbotPress}>
          <View style={styles.quiuContent}>
            <Text style={styles.quiuTitle}>Preguntale a Quiu</Text>
            <Text style={styles.quiuSubtitle}>Te ayudo a encontrar lo que se te antoja</Text>
          </View>
          <View style={styles.quiuIcon}>
            <Text style={styles.quiuEmoji}>🤖</Text>
          </View>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {CATEGORIES.map(category => (
              <CategoryItem
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category.id, category.name)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Restaurants */}
        {featuredRestaurants.length > 0 && !selectedCategory && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Destacados</Text>
            <FlatList
              data={featuredRestaurants}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <FeaturedRestaurantCard
                  restaurant={item}
                  onPress={() => handleRestaurantPress(item)}
                />
              )}
              contentContainerStyle={styles.featuredList}
            />
          </View>
        )}

        {/* All Restaurants */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedCategory ? `${CATEGORIES.find(c => c.id === selectedCategory)?.name || 'Restaurantes'}` : 'Todos los restaurantes'}
          </Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : restaurants.length > 0 ? (
            restaurants.map(restaurant => (
              <RestaurantCard
                key={restaurant.id}
                restaurant={restaurant}
                onPress={() => handleRestaurantPress(restaurant)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No se encontraron restaurantes</Text>
              <TouchableOpacity onPress={() => { setSelectedCategory(null); setSearchQuery(''); setRestaurants(MOCK_RESTAURANTS); }}>
                <Text style={styles.emptyLink}>Ver todos</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  addressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  addressText: {
    fontSize: 13,
    color: COLORS.gray,
    marginHorizontal: 4,
    maxWidth: 180,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  quiuBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quiuContent: {
    flex: 1,
  },
  quiuTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  quiuSubtitle: {
    fontSize: 13,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  quiuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quiuEmoji: {
    fontSize: 28,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  categoriesScroll: {
    marginLeft: -16,
    paddingLeft: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 8,
    fontWeight: '500',
  },
  featuredList: {
    paddingLeft: 0,
  },
  featuredCard: {
    width: CARD_WIDTH,
    marginRight: 16,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  featuredImage: {
    width: '100%',
    height: 140,
  },
  featuredOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredRating: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  featuredCategory: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  featuredMetaText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  featuredDot: {
    color: COLORS.gray,
    marginHorizontal: 6,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  restaurantImage: {
    width: 90,
    height: 90,
    borderRadius: 12,
  },
  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  restaurantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 2,
  },
  restaurantCategory: {
    fontSize: 13,
    color: COLORS.primary,
    marginTop: 2,
  },
  restaurantDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    lineHeight: 16,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 4,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.gray,
    marginTop: 12,
  },
  emptyLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 8,
  },
});
