import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler,
} from '../../utils/reanimatedShim';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import { useCartStore, Product } from '../../context/store';
import type { HomeStackScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

// Mock products data
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Hamburguesa Clásica',
    description: 'Carne de res, lechuga, tomate, cebolla y queso cheddar',
    price: 89,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    restaurantId: '1',
    categoryId: '1',
    isAvailable: true,
    preparationTime: 15,
  },
  {
    id: '2',
    name: 'Hamburguesa BBQ',
    description: 'Carne de res, tocino, aros de cebolla y salsa BBQ',
    price: 109,
    image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600',
    restaurantId: '1',
    categoryId: '1',
    isAvailable: true,
    preparationTime: 18,
  },
  {
    id: '3',
    name: 'Papas Fritas',
    description: 'Papas crujientes con sal y especias',
    price: 45,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600',
    restaurantId: '1',
    categoryId: '2',
    isAvailable: true,
    preparationTime: 10,
  },
  {
    id: '4',
    name: 'Refresco',
    description: 'Coca-Cola, Sprite o Fanta',
    price: 25,
    image: 'https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=600',
    restaurantId: '1',
    categoryId: '3',
    isAvailable: true,
    preparationTime: 2,
  },
  {
    id: '5',
    name: 'Malteada de Chocolate',
    description: 'Cremosa malteada con helado de chocolate',
    price: 65,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600',
    restaurantId: '1',
    categoryId: '3',
    isAvailable: true,
    preparationTime: 5,
  },
];

// Product Card Component
const ProductCard = ({
  product,
  onPress,
  index,
}: {
  product: Product;
  onPress: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);
  const { addItem, items } = useCartStore();

  const cartItem = items.find((item) => item.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem(product);
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
        <Animated.View style={[styles.productCard, animatedStyle]}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View style={styles.productContent}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription} numberOfLines={2}>
              {product.description}
            </Text>
            <View style={styles.productFooter}>
              <Text style={styles.productPrice}>${product.price}</Text>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  quantity > 0 && styles.addButtonActive,
                ]}
                onPress={handleAddToCart}
              >
                {quantity > 0 ? (
                  <Text style={styles.addButtonQuantity}>{quantity}</Text>
                ) : (
                  <Ionicons name="add" size={20} color={colors.textInverse} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const RestaurantDetailsScreen = ({
  navigation,
  route,
}: HomeStackScreenProps<'RestaurantDetails'>) => {
  const { restaurant } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerImageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0],
      [1.5, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const headerOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT - 100],
      [0, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFavorite(!isFavorite);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetails', { product, restaurant });
  };

  return (
    <View style={styles.container}>
      {/* Animated Header Image */}
      <Animated.View style={[styles.headerImageContainer, headerImageStyle]}>
        <Image source={{ uri: restaurant.image }} style={styles.headerImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.headerGradient}
        />
      </Animated.View>

      {/* Fixed Header Overlay */}
      <Animated.View style={[styles.headerOverlay, headerOverlayStyle]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.fixedHeader}>
            <Text style={styles.fixedHeaderTitle} numberOfLines={1}>
              {restaurant.name}
            </Text>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Back Button */}
      <SafeAreaView style={styles.backButtonContainer} edges={['top']}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? colors.error : colors.text}
          />
        </TouchableOpacity>
      </SafeAreaView>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Restaurant Info */}
        <View style={styles.restaurantInfo}>
          <Animated.View entering={SlideInUp.delay(200).duration(400)}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantDescription}>
              {restaurant.description}
            </Text>

            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Ionicons name="star" size={18} color={colors.accent} />
                <Text style={styles.metaText}>
                  {restaurant.rating} ({restaurant.reviewCount} reseñas)
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
                <Text style={styles.metaText}>
                  {restaurant.deliveryTime} min
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="bicycle-outline" size={18} color={colors.secondary} />
                <Text style={styles.metaText}>
                  ${restaurant.deliveryFee} envío
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Animated.Text
            style={styles.sectionTitle}
            entering={FadeIn.delay(300).duration(400)}
          >
            Menú
          </Animated.Text>
          {MOCK_PRODUCTS.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => handleProductPress(product)}
              index={index}
            />
          ))}
        </View>

        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>

      {/* Cart Button */}
      <CartButton navigation={navigation} />
    </View>
  );
};

// Floating Cart Button
const CartButton = ({ navigation }: { navigation: any }) => {
  const { items, getTotal, getItemCount } = useCartStore();
  const itemCount = getItemCount();
  const total = getTotal();

  if (itemCount === 0) return null;

  return (
    <Animated.View
      style={styles.cartButtonContainer}
      entering={SlideInUp.duration(300).springify()}
    >
      <TouchableOpacity
        style={styles.cartButton}
        onPress={() => navigation.navigate('Cart')}
      >
        <View style={styles.cartButtonLeft}>
          <View style={styles.cartButtonBadge}>
            <Text style={styles.cartButtonBadgeText}>{itemCount}</Text>
          </View>
          <Text style={styles.cartButtonText}>Ver carrito</Text>
        </View>
        <Text style={styles.cartButtonPrice}>${total.toFixed(2)}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 0,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    zIndex: 10,
    ...shadows.md,
  },
  fixedHeader: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  fixedHeaderTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  backButtonContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  scrollContent: {
    paddingTop: HEADER_HEIGHT - 30,
  },
  restaurantInfo: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    marginTop: -30,
  },
  restaurantName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  restaurantDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  productsSection: {
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  productImage: {
    width: 100,
    height: 100,
  },
  productContent: {
    flex: 1,
    padding: spacing.md,
  },
  productName: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  productDescription: {
    ...typography.small,
    color: colors.textSecondary,
    flex: 1,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  productPrice: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonActive: {
    backgroundColor: colors.secondary,
  },
  addButtonQuantity: {
    ...typography.small,
    color: colors.textInverse,
    fontWeight: '700',
  },
  cartButtonContainer: {
    position: 'absolute',
    bottom: 30,
    left: spacing.lg,
    right: spacing.lg,
  },
  cartButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.lg,
  },
  cartButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButtonBadge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  cartButtonBadgeText: {
    ...typography.small,
    color: colors.textInverse,
    fontWeight: '700',
  },
  cartButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  cartButtonPrice: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  bottomSpacer: {
    height: 120,
  },
});

export default RestaurantDetailsScreen;
