import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import { useCartStore } from '../../context/store';
import type { HomeStackScreenProps } from '../../navigation/types';

const CheckoutScreen = ({ navigation }: HomeStackScreenProps<'Checkout'>) => {
  const [selectedPayment, setSelectedPayment] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const { items, getTotal, clearCart } = useCartStore();

  const total = getTotal();
  const deliveryFee = 25;
  const serviceFee = total * 0.05;
  const grandTotal = total + deliveryFee + serviceFee;

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Simulate order processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    clearCart();

    Alert.alert(
      'Pedido confirmado',
      'Tu pedido está en camino. Puedes seguirlo en la sección de pedidos.',
      [
        {
          text: 'Ver pedido',
          onPress: () => navigation.navigate('OrderTracking', { orderId: '123' }),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Delivery Address */}
        <Animated.View
          style={styles.section}
          entering={FadeInDown.delay(100).duration(400)}
        >
          <Text style={styles.sectionTitle}>Dirección de entrega</Text>
          <TouchableOpacity style={styles.addressCard}>
            <View style={styles.addressIcon}>
              <Ionicons name="location" size={24} color={colors.primary} />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressTitle}>Casa</Text>
              <Text style={styles.addressText}>
                Av. Insurgentes Sur 1234, Col. Del Valle
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Animated.View>

        {/* Payment Method */}
        <Animated.View
          style={styles.section}
          entering={FadeInDown.delay(200).duration(400)}
        >
          <Text style={styles.sectionTitle}>Método de pago</Text>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'card' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPayment('card')}
          >
            <View style={styles.paymentIcon}>
              <Ionicons name="card" size={24} color={colors.primary} />
            </View>
            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>Tarjeta de crédito</Text>
              <Text style={styles.paymentText}>**** **** **** 4242</Text>
            </View>
            {selectedPayment === 'card' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              selectedPayment === 'cash' && styles.paymentOptionSelected,
            ]}
            onPress={() => setSelectedPayment('cash')}
          >
            <View style={styles.paymentIcon}>
              <Ionicons name="cash" size={24} color={colors.success} />
            </View>
            <View style={styles.paymentContent}>
              <Text style={styles.paymentTitle}>Efectivo</Text>
              <Text style={styles.paymentText}>Paga al recibir</Text>
            </View>
            {selectedPayment === 'cash' && (
              <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Order Summary */}
        <Animated.View
          style={styles.section}
          entering={FadeInDown.delay(300).duration(400)}
        >
          <Text style={styles.sectionTitle}>Resumen</Text>
          <View style={styles.summaryCard}>
            {items.map((item) => (
              <View key={item.product.id} style={styles.summaryItem}>
                <Text style={styles.summaryItemName}>
                  {item.quantity}x {item.product.name}
                </Text>
                <Text style={styles.summaryItemPrice}>
                  ${(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
            <View style={styles.summaryDivider} />
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
          </View>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Place Order Button */}
      <Animated.View
        style={styles.orderButtonContainer}
        entering={SlideInUp.delay(400).duration(400).springify()}
      >
        <TouchableOpacity
          style={[styles.orderButton, isProcessing && styles.orderButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Text style={styles.orderButtonText}>Procesando...</Text>
          ) : (
            <>
              <Text style={styles.orderButtonText}>Confirmar pedido</Text>
              <Text style={styles.orderButtonPrice}>${grandTotal.toFixed(2)}</Text>
            </>
          )}
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
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  addressIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  addressContent: {
    flex: 1,
  },
  addressTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  addressText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  paymentOptionSelected: {
    borderColor: colors.primary,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  paymentContent: {
    flex: 1,
  },
  paymentTitle: {
    ...typography.bodyBold,
    color: colors.text,
  },
  paymentText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryItemName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  summaryItemPrice: {
    ...typography.body,
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
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
  },
  totalLabel: {
    ...typography.bodyBold,
    color: colors.text,
  },
  totalValue: {
    ...typography.h3,
    color: colors.primary,
  },
  orderButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    ...shadows.lg,
  },
  orderButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  orderButtonDisabled: {
    opacity: 0.7,
  },
  orderButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  orderButtonPrice: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default CheckoutScreen;
