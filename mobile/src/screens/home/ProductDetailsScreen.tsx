import React, { useState, useEffect } from 'react';
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
  FadeInUp,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from '../../utils/reanimatedShim';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import { useCartStore, Product } from '../../context/store';
import type { HomeStackScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Sweet treats / suggestions data
const SWEET_TREATS: Product[] = [
  {
    id: 'treat-1',
    name: 'Dona Glaseada',
    description: 'Dona suave con glaseado de azúcar',
    price: 25,
    image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400',
    restaurantId: '1',
    categoryId: 'treats',
    isAvailable: true,
  },
  {
    id: 'treat-2',
    name: 'Dona de Chocolate',
    description: 'Dona cubierta de chocolate',
    price: 28,
    image: 'https://images.unsplash.com/photo-1527904324834-3bda86da6771?w=400',
    restaurantId: '1',
    categoryId: 'treats',
    isAvailable: true,
  },
  {
    id: 'treat-3',
    name: 'Dona con Sprinkles',
    description: 'Dona colorida con chispas',
    price: 30,
    image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400',
    restaurantId: '1',
    categoryId: 'treats',
    isAvailable: true,
  },
];

// Sweet Treat Card with animations
const SweetTreatCard = ({
  treat,
  onAdd,
  index,
}: {
  treat: Product;
  onAdd: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const handleAdd = () => {
    buttonScale.value = withSequence(
      withTiming(1.2, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAdd();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <Animated.View
      entering={SlideInUp.delay(index * 120).duration(400).springify()}
      style={[styles.treatCard, animatedStyle]}
    >
      <Image source={{ uri: treat.image }} style={styles.treatImage} />
      <Text style={styles.treatName}>{treat.name}</Text>
      <Text style={styles.treatPrice}>${treat.price}</Text>
      <Animated.View style={buttonAnimatedStyle}>
        <TouchableOpacity style={styles.treatAddButton} onPress={handleAdd}>
          <Ionicons name="add" size={18} color={colors.textInverse} />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

// Suggestions Box Component
const SuggestionsBox = ({
  visible,
  onDismiss,
  onAddTreat,
}: {
  visible: boolean;
  onDismiss: () => void;
  onAddTreat: (treat: Product) => void;
}) => {
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 12 });
    }
  }, [visible]);

  if (!visible) return null;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  return (
    <Animated.View
      entering={SlideInUp.duration(400).springify()}
      exiting={SlideOutDown.duration(300)}
      style={styles.suggestionsContainer}
    >
      <LinearGradient
        colors={[colors.surface, '#FFF8F0']}
        style={styles.suggestionsBox}
      >
        <Animated.View entering={FadeIn.delay(200)}>
          <View style={styles.suggestionsHeader}>
            <Text style={styles.suggestionsEmoji}>🍩</Text>
            <View style={styles.suggestionsTextContainer}>
              <Text style={styles.suggestionsTitle}>¿Algo dulce?</Text>
              <Text style={styles.suggestionsSubtitle}>
                Agrega un postre a tu pedido
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.treatsList}
          >
            {SWEET_TREATS.map((treat, index) => (
              <SweetTreatCard
                key={treat.id}
                treat={treat}
                onAdd={() => onAddTreat(treat)}
                index={index}
              />
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissButtonText}>No gracias</Text>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

// Main Product Details Screen
const ProductDetailsScreen = ({
  navigation,
  route,
}: HomeStackScreenProps<'ProductDetails'>) => {
  const { product, restaurant } = route.params;
  const [quantity, setQuantity] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notes, setNotes] = useState('');

  const { addItem } = useCartStore();
  const imageScale = useSharedValue(1);
  const cartIconScale = useSharedValue(1);

  const totalPrice = product.price * quantity;

  useEffect(() => {
    // Show suggestions after a delay
    const timer = setTimeout(() => {
      setShowSuggestions(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    addItem(product, quantity);

    // Animate cart icon
    cartIconScale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withTiming(1.15, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Go back after adding
    setTimeout(() => {
      navigation.goBack();
    }, 300);
  };

  const handleAddTreat = (treat: Product) => {
    addItem(treat, 1);

    cartIconScale.value = withSequence(
      withTiming(0.9, { duration: 80 }),
      withTiming(1.15, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: imageScale.value }],
  }));

  const cartIconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartIconScale.value }],
  }));

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <Animated.View
          style={styles.header}
          entering={SlideInDown.duration(300)}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Animated.View style={cartIconAnimatedStyle}>
            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => navigation.navigate('Cart')}
            >
              <Ionicons name="cart-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Product Image */}
          <Animated.View
            entering={SlideInUp.delay(100).duration(400)}
            style={styles.imageContainer}
          >
            <Animated.Image
              source={{ uri: product.image }}
              style={[styles.productImage, imageAnimatedStyle]}
            />
          </Animated.View>

          {/* Product Info */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={styles.productInfo}
          >
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.productDescription}>{product.description}</Text>

            {product.preparationTime && (
              <View style={styles.prepTimeContainer}>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.prepTimeText}>
                  Tiempo de preparación: {product.preparationTime} min
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Quantity Selector */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(400)}
            style={styles.quantitySection}
          >
            <Text style={styles.quantityLabel}>Cantidad</Text>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={[
                  styles.quantityButton,
                  quantity <= 1 && styles.quantityButtonDisabled,
                ]}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                <Ionicons
                  name="remove"
                  size={20}
                  color={quantity <= 1 ? colors.textLight : colors.text}
                />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
              >
                <Ionicons name="add" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Suggestions Box */}
          <SuggestionsBox
            visible={showSuggestions}
            onDismiss={() => setShowSuggestions(false)}
            onAddTreat={handleAddTreat}
          />

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Add to Cart Button */}
        <Animated.View
          style={styles.addToCartContainer}
          entering={SlideInUp.delay(400).duration(400).springify()}
        >
          <TouchableOpacity
            style={styles.addToCartButton}
            onPress={handleAddToCart}
          >
            <Text style={styles.addToCartText}>Agregar al carrito</Text>
            <Text style={styles.addToCartPrice}>${totalPrice.toFixed(2)}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  productImage: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: borderRadius.xl,
  },
  productInfo: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  productName: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  productDescription: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  prepTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  prepTimeText: {
    ...typography.small,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  quantityLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
  },
  quantityButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    ...typography.h3,
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
  // Suggestions styles
  suggestionsContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  suggestionsBox: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  suggestionsEmoji: {
    fontSize: 40,
    marginRight: spacing.md,
  },
  suggestionsTextContainer: {
    flex: 1,
  },
  suggestionsTitle: {
    ...typography.h3,
    color: colors.text,
  },
  suggestionsSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  treatsList: {
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  treatCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginRight: spacing.md,
    width: 110,
    ...shadows.sm,
  },
  treatImage: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  treatName: {
    ...typography.small,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  treatPrice: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  treatAddButton: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButton: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  dismissButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addToCartContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    ...shadows.lg,
  },
  addToCartButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  addToCartText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  addToCartPrice: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default ProductDetailsScreen;
