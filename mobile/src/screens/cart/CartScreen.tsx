import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  FadeOut,
  Layout,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from '../../utils/reanimatedShim';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import { useCartStore, CartItem } from '../../context/store';
import type { HomeStackScreenProps } from '../../navigation/types';

// Cart Item Component
const CartItemCard = ({
  item,
  onUpdateQuantity,
  onRemove,
  index,
}: {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
  index: number;
}) => {
  const scale = useSharedValue(1);

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove();
  };

  const handleQuantityChange = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdateQuantity(item.quantity + delta);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      <Animated.View style={[styles.cartItem, animatedStyle]}>
        <Image source={{ uri: item.product.image }} style={styles.itemImage} />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <TouchableOpacity onPress={handleRemove}>
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemPrice}>${item.product.price}</Text>
          <View style={styles.itemFooter}>
            <View style={styles.quantitySelector}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(-1)}
              >
                <Ionicons name="remove" size={16} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => handleQuantityChange(1)}
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.itemTotal}>
              ${(item.product.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

// Empty Cart Component
const EmptyCart = ({ onGoShopping }: { onGoShopping: () => void }) => (
  <Animated.View
    style={styles.emptyContainer}
    entering={FadeInDown.duration(400)}
  >
    <Text style={styles.emptyEmoji}>🛒</Text>
    <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
    <Text style={styles.emptySubtitle}>
      Agrega productos para comenzar tu pedido
    </Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onGoShopping}>
      <Text style={styles.emptyButtonText}>Explorar restaurantes</Text>
    </TouchableOpacity>
  </Animated.View>
);

const CartScreen = ({ navigation }: HomeStackScreenProps<'Cart'>) => {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  const total = getTotal();
  const deliveryFee = 25;
  const serviceFee = total * 0.05;
  const grandTotal = total + deliveryFee + serviceFee;

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
  };

  const handleCheckout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.navigate('Checkout');
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi carrito</Text>
          <View style={styles.headerRight} />
        </View>
        <EmptyCart onGoShopping={() => navigation.navigate('Home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi carrito</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearButton}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          {items.map((item, index) => (
            <CartItemCard
              key={item.product.id}
              item={item}
              onUpdateQuantity={(qty) =>
                handleUpdateQuantity(item.product.id, qty)
              }
              onRemove={() => handleRemoveItem(item.product.id)}
              index={index}
            />
          ))}
        </View>

        {/* Order Summary */}
        <Animated.View
          style={styles.summarySection}
          entering={FadeInDown.delay(300).duration(400)}
        >
          <Text style={styles.summaryTitle}>Resumen del pedido</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Envío</Text>
            <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Servicio</Text>
            <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${grandTotal.toFixed(2)}</Text>
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Checkout Button */}
      <Animated.View
        style={styles.checkoutContainer}
        entering={SlideInUp.delay(400).duration(400).springify()}
      >
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutText}>Continuar al pago</Text>
          <Text style={styles.checkoutPrice}>${grandTotal.toFixed(2)}</Text>
        </TouchableOpacity>
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
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
    ...typography.h3,
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  clearButton: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  itemsSection: {
    paddingHorizontal: spacing.lg,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  itemImage: {
    width: 100,
    height: 100,
  },
  itemContent: {
    flex: 1,
    padding: spacing.md,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...typography.bodyBold,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemPrice: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.md,
  },
  quantityButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    ...typography.bodyBold,
    color: colors.text,
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  summarySection: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  summaryTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryValue: {
    ...typography.body,
    color: colors.text,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    ...shadows.lg,
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  checkoutText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  checkoutPrice: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  bottomSpacer: {
    height: 50,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
});

export default CartScreen;
