import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  SlideInDown,
  SlideInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
} from '../../utils/reanimatedShim';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import { useAppStore, useCartStore, Restaurant, Category } from '../../context/store';
import type { HomeStackScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.75;
const CARD_HEIGHT = 200;

// Mock data (replace with API calls)
const CATEGORIES: Category[] = [
  { id: '1', name: 'Comida', icon: '🍔' },
  { id: '2', name: 'Bebidas', icon: '🥤' },
  { id: '3', name: 'Postres', icon: '🍩' },
  { id: '4', name: 'Café', icon: '☕' },
  { id: '5', name: 'Saludable', icon: '🥗' },
  { id: '6', name: 'Pizza', icon: '🍕' },
  { id: '7', name: 'Sushi', icon: '🍣' },
  { id: '8', name: 'Tacos', icon: '🌮' },
];

const FEATURED_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: 'Burger Palace',
    description: 'Las mejores hamburguesas de la ciudad',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    rating: 4.8,
    reviewCount: 234,
    deliveryTime: '25-35',
    deliveryFee: 25,
    minOrder: 100,
    categories: ['Comida'],
    isOpen: true,
  },
  {
    id: '2',
    name: 'Sushi Master',
    description: 'Auténtico sushi japonés',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
    rating: 4.9,
    reviewCount: 456,
    deliveryTime: '30-45',
    deliveryFee: 35,
    minOrder: 150,
    categories: ['Sushi'],
    isOpen: true,
  },
  {
    id: '3',
    name: 'Taco Loco',
    description: 'Tacos al pastor como en México',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
    rating: 4.7,
    reviewCount: 189,
    deliveryTime: '20-30',
    deliveryFee: 20,
    minOrder: 80,
    categories: ['Tacos'],
    isOpen: true,
  },
];

const POPULAR_RESTAURANTS: Restaurant[] = [
  {
    id: '4',
    name: 'Pizza Express',
    description: 'Pizza artesanal al horno',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    rating: 4.6,
    reviewCount: 312,
    deliveryTime: '25-40',
    deliveryFee: 30,
    minOrder: 120,
    categories: ['Pizza'],
    isOpen: true,
  },
  {
    id: '5',
    name: 'Green Bowl',
    description: 'Comida saludable y deliciosa',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    rating: 4.5,
    reviewCount: 167,
    deliveryTime: '20-30',
    deliveryFee: 25,
    minOrder: 90,
    categories: ['Saludable'],
    isOpen: true,
  },
  {
    id: '6',
    name: 'Café Aroma',
    description: 'El mejor café de especialidad',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800',
    rating: 4.8,
    reviewCount: 289,
    deliveryTime: '15-25',
    deliveryFee: 15,
    minOrder: 50,
    categories: ['Café'],
    isOpen: true,
  },
];

// Animated Category Button
const CategoryButton = ({
  category,
  isActive,
  onPress,
  index,
}: {
  category: Category;
  isActive: boolean;
  onPress: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(1.15, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 80).duration(400).springify()}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View
          style={[
            styles.categoryButton,
            isActive && styles.categoryButtonActive,
            animatedStyle,
          ]}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text
            style={[
              styles.categoryText,
              isActive && styles.categoryTextActive,
            ]}
          >
            {category.name}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated Food Card (Horizontal Scroll)
const FoodCard = ({
  restaurant,
  onPress,
  scrollX,
  index,
}: {
  restaurant: Restaurant;
  onPress: () => void;
  scrollX: Animated.SharedValue<number>;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10 });
  };

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const cardScale = interpolate(
      scrollX.value,
      inputRange,
      [0.9, 1, 0.9],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale: cardScale * scale.value }],
      opacity,
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [-30, 0, 30],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
    >
      <Animated.View style={[styles.foodCard, cardAnimatedStyle]}>
        <View style={styles.foodCardImageContainer}>
          <Animated.Image
            source={{ uri: restaurant.image }}
            style={[styles.foodCardImage, imageAnimatedStyle]}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.foodCardGradient}
          />
        </View>
        <View style={styles.foodCardContent}>
          <Text style={styles.foodCardTitle}>{restaurant.name}</Text>
          <Text style={styles.foodCardDescription} numberOfLines={1}>
            {restaurant.description}
          </Text>
          <View style={styles.foodCardMeta}>
            <View style={styles.foodCardRating}>
              <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={styles.foodCardRatingText}>{restaurant.rating}</Text>
            </View>
            <View style={styles.foodCardDelivery}>
              <Ionicons name="time-outline" size={14} color={colors.textInverse} />
              <Text style={styles.foodCardDeliveryText}>
                {restaurant.deliveryTime} min
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Restaurant List Card
const RestaurantCard = ({
  restaurant,
  onPress,
  index,
}: {
  restaurant: Restaurant;
  onPress: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(400).springify()}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <Animated.View style={[styles.restaurantCard, animatedStyle]}>
          <Image
            source={{ uri: restaurant.image }}
            style={styles.restaurantCardImage}
          />
          <View style={styles.restaurantCardContent}>
            <Text style={styles.restaurantCardTitle}>{restaurant.name}</Text>
            <Text style={styles.restaurantCardDescription} numberOfLines={1}>
              {restaurant.description}
            </Text>
            <View style={styles.restaurantCardMeta}>
              <View style={styles.restaurantCardRating}>
                <Ionicons name="star" size={14} color={colors.accent} />
                <Text style={styles.restaurantCardRatingText}>
                  {restaurant.rating}
                </Text>
                <Text style={styles.restaurantCardReviews}>
                  ({restaurant.reviewCount})
                </Text>
              </View>
              <Text style={styles.restaurantCardDot}>•</Text>
              <Text style={styles.restaurantCardDeliveryTime}>
                {restaurant.deliveryTime} min
              </Text>
              <Text style={styles.restaurantCardDot}>•</Text>
              <Text style={styles.restaurantCardDeliveryFee}>
                ${restaurant.deliveryFee} envío
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Main Home Screen
const HomeScreen = ({ navigation }: HomeStackScreenProps<'Home'>) => {
  const [refreshing, setRefreshing] = useState(false);
  const { selectedCategory, setSelectedCategory } = useAppStore();
  const cartItemCount = useCartStore((state) => state.getItemCount());

  const scrollX = useSharedValue(0);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const mainScrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const onRefresh = async () => {
    setRefreshing(true);
    // Fetch data from API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleRestaurantPress = (restaurant: Restaurant) => {
    navigation.navigate('RestaurantDetails', { restaurant });
  };

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <Animated.View
        style={[styles.header, headerAnimatedStyle]}
        entering={SlideInDown.duration(300)}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.headerGreeting}>Hola! 👋</Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.locationText}>Ciudad de México</Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </View>
        <TouchableOpacity
          style={styles.cartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={24} color={colors.text} />
          {cartItemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={mainScrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Search Bar */}
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={styles.searchContainer}
        >
          <TouchableOpacity style={styles.searchBar} activeOpacity={0.8}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <Text style={styles.searchPlaceholder}>
              ¿Qué se te antoja hoy?
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Categories */}
        <View style={styles.categoriesSection}>
          <Animated.Text
            style={styles.sectionTitle}
            entering={FadeIn.delay(300).duration(400)}
          >
            Categorías
          </Animated.Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {CATEGORIES.map((category, index) => (
              <CategoryButton
                key={category.id}
                category={category}
                isActive={selectedCategory === category.id}
                onPress={() => handleCategoryPress(category.id)}
                index={index}
              />
            ))}
          </ScrollView>
        </View>

        {/* Featured Restaurants */}
        <View style={styles.featuredSection}>
          <Animated.Text
            style={styles.sectionTitle}
            entering={FadeIn.delay(400).duration(400)}
          >
            Destacados 🔥
          </Animated.Text>
          <Animated.FlatList
            data={FEATURED_RESTAURANTS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + spacing.md}
            decelerationRate="fast"
            contentContainerStyle={styles.featuredList}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <FoodCard
                restaurant={item}
                onPress={() => handleRestaurantPress(item)}
                scrollX={scrollX}
                index={index}
              />
            )}
          />
        </View>

        {/* Popular Restaurants */}
        <View style={styles.popularSection}>
          <Animated.Text
            style={styles.sectionTitle}
            entering={FadeIn.delay(500).duration(400)}
          >
            Populares cerca de ti
          </Animated.Text>
          {POPULAR_RESTAURANTS.map((restaurant, index) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
              onPress={() => handleRestaurantPress(restaurant)}
              index={index}
            />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  headerLeft: {
    flex: 1,
  },
  headerGreeting: {
    ...typography.h3,
    color: colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  locationText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginHorizontal: spacing.xs,
  },
  cartButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  searchPlaceholder: {
    ...typography.body,
    color: colors.textLight,
    marginLeft: spacing.sm,
  },
  categoriesSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    marginRight: spacing.sm,
    minWidth: 80,
    ...shadows.sm,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  categoryText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.textInverse,
  },
  featuredSection: {
    marginBottom: spacing.xl,
  },
  featuredList: {
    paddingHorizontal: spacing.lg,
  },
  foodCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    ...shadows.lg,
  },
  foodCardImageContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  foodCardImage: {
    width: CARD_WIDTH + 60,
    height: '100%',
    marginLeft: -30,
  },
  foodCardGradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
  },
  foodCardContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  foodCardTitle: {
    ...typography.bodyBold,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  foodCardDescription: {
    ...typography.small,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.sm,
  },
  foodCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  foodCardRatingText: {
    ...typography.small,
    color: colors.textInverse,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  foodCardDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodCardDeliveryText: {
    ...typography.small,
    color: colors.textInverse,
    marginLeft: spacing.xs,
  },
  popularSection: {
    paddingHorizontal: spacing.lg,
  },
  restaurantCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  restaurantCardImage: {
    width: 100,
    height: 100,
  },
  restaurantCardContent: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  restaurantCardTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  restaurantCardDescription: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  restaurantCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  restaurantCardRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restaurantCardRatingText: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    marginLeft: 4,
  },
  restaurantCardReviews: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  restaurantCardDot: {
    color: colors.textLight,
    marginHorizontal: spacing.sm,
  },
  restaurantCardDeliveryTime: {
    ...typography.small,
    color: colors.textSecondary,
  },
  restaurantCardDeliveryFee: {
    ...typography.small,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default HomeScreen;
