// ==========================================
// DEVOLÓN — Customer Home
//
// Hero feed editorial: header dark con saludo + dirección + acceso a
// chatbot y carrito, search bar glass, banner "Pregúntale a Devo",
// categorías horizontales pill-style, destacados cinematográficos y
// listado vertical de restaurantes en cards glass.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Restaurant } from '../../types';
import { Input, Card, Section } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const { width } = Dimensions.get('window');
const FEATURED_CARD_W = width * 0.78;

type Category = { id: string; name: string; icon: string };

const CATEGORIES: Category[] = [
  { id: '1', name: 'Tacos', icon: '🌮' },
  { id: '2', name: 'Pizza', icon: '🍕' },
  { id: '3', name: 'Burgers', icon: '🍔' },
  { id: '4', name: 'Sushi', icon: '🍣' },
  { id: '5', name: 'Pollos', icon: '🍗' },
  { id: '6', name: 'Mariscos', icon: '🦐' },
  { id: '7', name: 'Postres', icon: '🍰' },
  { id: '8', name: 'Bebidas', icon: '🥤' },
  { id: '9', name: 'Saludable', icon: '🥗' },
  { id: '10', name: 'Desayunos', icon: '🍳' },
];

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    ownerId: '1',
    name: 'Tacos El Patrón',
    description: 'Los mejores tacos de la ciudad con recetas tradicionales.',
    logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    coverImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    address: { id: '1', label: 'Local', street: 'Av. Revolución', number: '123', neighborhood: 'Centro', city: 'CDMX', state: 'CDMX', zipCode: '06000', location: { latitude: 19.4326, longitude: -99.1332 }, isDefault: true },
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
    description: 'Auténtica pizza italiana con ingredientes importados.',
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    coverImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    address: { id: '2', label: 'Local', street: 'Calle Roma', number: '456', neighborhood: 'Roma Norte', city: 'CDMX', state: 'CDMX', zipCode: '06700', location: { latitude: 19.42, longitude: -99.16 }, isDefault: true },
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
    description: 'Hamburguesas artesanales con carne Angus.',
    logo: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200',
    coverImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    address: { id: '3', label: 'Local', street: 'Av. Insurgentes', number: '789', neighborhood: 'Del Valle', city: 'CDMX', state: 'CDMX', zipCode: '03100', location: { latitude: 19.38, longitude: -99.17 }, isDefault: true },
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
    description: 'El mejor sushi japonés con pescado fresco diario.',
    logo: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200',
    coverImage: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    address: { id: '4', label: 'Local', street: 'Calle Polanco', number: '321', neighborhood: 'Polanco', city: 'CDMX', state: 'CDMX', zipCode: '11550', location: { latitude: 19.435, longitude: -99.19 }, isDefault: true },
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

const CategoryPill = ({ category, active, onPress }: { category: Category; active: boolean; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.categoryPill, active && styles.categoryPillActive]}>
    <Text style={styles.categoryEmoji}>{category.icon}</Text>
    <Text style={[styles.categoryName, active && styles.categoryNameActive]}>{category.name}</Text>
  </TouchableOpacity>
);

const FeaturedCard = ({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) => (
  <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.featuredCard}>
    <Image source={{ uri: restaurant.coverImage }} style={styles.featuredImage} />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.85)']}
      style={styles.featuredGradient}
    />
    <View style={styles.featuredBadge}>
      <Ionicons name="star" size={12} color={colors.primary} />
      <Text style={styles.featuredBadgeText}>{restaurant.rating}</Text>
    </View>
    <View style={styles.featuredInfo}>
      <Text style={styles.featuredName} numberOfLines={1}>{restaurant.name}</Text>
      <View style={styles.featuredMeta}>
        <Text style={styles.featuredCategory}>{restaurant.category}</Text>
        <View style={styles.dot} />
        <Ionicons name="time-outline" size={11} color={colors.textMuted} />
        <Text style={styles.featuredMetaText}>{restaurant.deliveryTime}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const RestaurantRow = ({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) => (
  <Card variant="glass" onPress={onPress} padding={s.md} borderRadius={radius.xl} style={styles.row}>
    <Image source={{ uri: restaurant.logo }} style={styles.rowImage} />
    <View style={styles.rowBody}>
      <View style={styles.rowHeader}>
        <Text style={styles.rowName} numberOfLines={1}>{restaurant.name}</Text>
        <View style={styles.rowRating}>
          <Ionicons name="star" size={11} color={colors.primary} />
          <Text style={styles.rowRatingText}>{restaurant.rating}</Text>
        </View>
      </View>
      <Text style={styles.rowCategory}>{restaurant.category}</Text>
      <Text style={styles.rowDescription} numberOfLines={2}>{restaurant.description}</Text>
      <View style={styles.rowMeta}>
        <View style={styles.metaPill}>
          <Ionicons name="time-outline" size={11} color={colors.textMuted} />
          <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name="bicycle-outline" size={11} color={colors.textMuted} />
          <Text style={styles.metaText}>${restaurant.deliveryFee}</Text>
        </View>
        <View style={styles.metaPill}>
          <Ionicons name="cart-outline" size={11} color={colors.textMuted} />
          <Text style={styles.metaText}>Mín ${restaurant.minimumOrder}</Text>
        </View>
      </View>
    </View>
  </Card>
);

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const { itemCount } = useCartStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(MOCK_RESTAURANTS);
  const [featured, setFeatured] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Dirección actual del cliente — primero intenta reverse-geocode desde
  // el GPS del teléfono, fallback a "Selecciona tu dirección" si el
  // usuario negó permisos o no se pudo resolver. El tap permite cambiarla
  // manualmente (a futuro: abrir picker de direcciones guardadas).
  const [currentAddress, setCurrentAddress] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locating, setLocating] = useState(true);

  const detectLocation = async () => {
    setLocating(true);
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentAddress(null);
        setCurrentCoords(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCurrentCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      const results = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const place = results?.[0];
      if (place) {
        const street =
          [place.street, place.streetNumber].filter(Boolean).join(' ') ||
          place.name ||
          '';
        const area = place.district || place.subregion || place.city || '';
        const label = [street, area].filter(Boolean).join(', ');
        setCurrentAddress(label || 'Cerca de ti');
      } else {
        setCurrentAddress('Cerca de ti');
      }
    } catch {
      setCurrentAddress(null);
      setCurrentCoords(null);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    detectLocation();
  }, []);

  // Recarga el feed cuando cambien las coords (GPS resuelto) o la zona
  // registrada del usuario. Estrategia híbrida: si tenemos GPS, el
  // backend filtra por radio de entrega de cada restaurante. Si no, usa
  // la zona del usuario como fallback de marketing.
  useEffect(() => {
    loadRestaurants();
  }, [currentCoords?.lat, currentCoords?.lng, (user as any)?.zone]);

  const loadRestaurants = async () => {
    setIsLoading(true);
    try {
      const { restaurantsApi } = await import('../../services/api');
      const params: any = {};
      if (currentCoords) {
        params.lat = currentCoords.lat;
        params.lng = currentCoords.lng;
      }
      if ((user as any)?.zone) {
        params.zone = (user as any).zone;
      }
      const data = await restaurantsApi.getAll(params);
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0) {
        // Fallback a mocks SOLO en dev cuando no hay nada cerca, para
        // no dejar la UI vacía durante QA. En prod este array vendría
        // vacío y mostraríamos el empty state real.
        if (__DEV__) {
          setRestaurants(MOCK_RESTAURANTS);
          setFeatured(MOCK_RESTAURANTS.filter((r) => r.rating >= 4.7));
        } else {
          setRestaurants([]);
          setFeatured([]);
        }
      } else {
        setRestaurants(list);
        setFeatured(list.filter((r: any) => Number(r.rating) >= 4.7));
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
      // En error de red, mostramos mocks para no dejar la UI rota.
      setRestaurants(MOCK_RESTAURANTS);
      setFeatured(MOCK_RESTAURANTS.filter((r) => r.rating >= 4.7));
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
      setRestaurants(MOCK_RESTAURANTS.filter((r) => r.category === categoryName));
    }
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetail', { restaurant });
  };

  const handleSearchSubmit = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return setRestaurants(MOCK_RESTAURANTS);
    setRestaurants(
      MOCK_RESTAURANTS.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q),
      ),
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.eyebrow}>DEVOLÓN</Text>
          <Text style={styles.greeting} numberOfLines={1}>
            Hola, {user?.name?.split(' ')[0] || 'amigo'}
          </Text>
          <TouchableOpacity
            style={styles.locationRow}
            activeOpacity={0.7}
            onPress={detectLocation}
            disabled={locating}
          >
            <Ionicons name="location" size={13} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {locating
                ? 'Detectando ubicación…'
                : currentAddress || 'Toca para detectar tu ubicación'}
            </Text>
            <Ionicons
              name={locating ? 'sync' : 'refresh'}
              size={14}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Chatbot')}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={20} color={colors.text} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Input
          variant="filled"
          icon="search"
          placeholder="Restaurantes, platillos…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
          rightIcon={searchQuery ? 'close-circle' : undefined}
          onRightIconPress={() => {
            setSearchQuery('');
            setRestaurants(MOCK_RESTAURANTS);
          }}
        />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        {/* CHATBOT BANNER */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Chatbot')}
          style={styles.devoBanner}
        >
          <View style={styles.devoLeft}>
            <Text style={styles.devoEyebrow}>ASISTENTE INTELIGENTE</Text>
            <Text style={styles.devoTitle}>Pregúntale a Devo</Text>
            <Text style={styles.devoSubtitle}>
              Te ayudo a encontrar lo que se te antoja.
            </Text>
          </View>
          <View style={styles.devoIcon}>
            <MaterialCommunityIcons
              name="robot-happy"
              size={28}
              color={colors.onPrimary}
            />
          </View>
        </TouchableOpacity>

        {/* CATEGORIES */}
        <View style={styles.sectionWrap}>
          <Section title="Categorías" eyebrow="EXPLORA" spacing={s.md}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
              {CATEGORIES.map((c) => (
                <CategoryPill
                  key={c.id}
                  category={c}
                  active={selectedCategory === c.id}
                  onPress={() => handleCategoryPress(c.id, c.name)}
                />
              ))}
            </ScrollView>
          </Section>
        </View>

        {/* FEATURED */}
        {featured.length > 0 && !selectedCategory && (
          <View style={styles.sectionWrap}>
            <Section title="Destacados" eyebrow="TENDENCIA" spacing={s.md}>
              <FlatList
                data={featured}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <FeaturedCard restaurant={item} onPress={() => handleRestaurantPress(item)} />
                )}
                contentContainerStyle={styles.featuredList}
              />
            </Section>
          </View>
        )}

        {/* ALL */}
        <View style={styles.sectionWrap}>
          <Section
            title={selectedCategory ? CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Restaurantes' : 'Cerca de ti'}
            eyebrow={selectedCategory ? 'FILTRADO' : 'TODOS'}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: s.xl }} />
            ) : restaurants.length > 0 ? (
              restaurants.map((r) => (
                <RestaurantRow key={r.id} restaurant={r} onPress={() => handleRestaurantPress(r)} />
              ))
            ) : (
              <View style={styles.empty}>
                <Ionicons name="restaurant-outline" size={48} color={colors.textFaint} />
                <Text style={styles.emptyText}>No encontramos resultados</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                    setRestaurants(MOCK_RESTAURANTS);
                  }}
                >
                  <Text style={styles.emptyLink}>Ver todos</Text>
                </TouchableOpacity>
              </View>
            )}
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ HEADER ============
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.sm,
  },
  headerLeft: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  greeting: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xxs,
    marginTop: 2,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    maxWidth: 180,
  },
  headerRight: {
    flexDirection: 'row',
    gap: s.xs,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: fontWeight.black,
  },

  // ============ SEARCH ============
  searchWrap: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },

  // ============ CHATBOT BANNER ============
  devoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s.xl,
    marginBottom: s.lg,
    padding: s.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    overflow: 'hidden',
  },
  devoLeft: { flex: 1 },
  devoEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: 4,
  },
  devoTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  devoSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  devoIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },

  // ============ SECTIONS ============
  sectionWrap: { paddingHorizontal: s.xl },

  // ============ CATEGORIES ============
  categoriesRow: {
    gap: s.xs,
    paddingRight: s.lg,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryPillActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  categoryEmoji: { fontSize: 16 },
  categoryName: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  categoryNameActive: { color: colors.primary },

  // ============ FEATURED ============
  featuredList: {
    gap: s.sm,
    paddingRight: s.lg,
  },
  featuredCard: {
    width: FEATURED_CARD_W,
    height: 200,
    borderRadius: radius.xl,
    backgroundColor: colors.bgRaised,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: s.sm,
  },
  featuredImage: { width: '100%', height: '100%' },
  featuredGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  featuredBadgeText: {
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
  },
  featuredInfo: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
  },
  featuredName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  featuredCategory: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.textFaint,
  },
  featuredMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // ============ ROW (vertical card) ============
  row: {
    flexDirection: 'row',
    gap: s.md,
    marginBottom: s.sm,
  },
  rowImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
  },
  rowBody: { flex: 1 },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginRight: s.xs,
  },
  rowRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
  },
  rowRatingText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
  },
  rowCategory: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  rowDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 4,
    lineHeight: 18,
  },
  rowMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
    marginTop: s.sm,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // ============ EMPTY ============
  empty: {
    alignItems: 'center',
    paddingVertical: s['2xl'],
    gap: s.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  emptyLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
});
