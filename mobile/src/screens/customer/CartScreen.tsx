// ==========================================
// DEVOLÓN — Cart
//
// Resumen del pedido en dark. Header con back + acción "Vaciar" en danger.
// Restaurant pill, items en cards glass con qty stepper amarillo, cupón en
// Input filled, summary card con total hero number en amarillo, CTA fijo
// inferior "PAGAR" con glow.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCartStore, CartItem } from '../../store/cartStore';
import { Button, Card, Header, Input, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

// ============ Cart Item ============
const CartItemCard = ({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) => (
  <Card variant="glass" padding={s.md} borderRadius={radius.xl} style={styles.itemCard}>
    <Image source={{ uri: item.product.image }} style={styles.itemImage} />
    <View style={styles.itemContent}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <TouchableOpacity
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {item.selectedOptions.length > 0 && (
        <View style={styles.optionsList}>
          {item.selectedOptions.map((opt, index) => (
            <Text key={index} style={styles.optionText} numberOfLines={1}>
              + {opt.choiceName}
              {opt.price > 0 && ` (+$${opt.price})`}
            </Text>
          ))}
        </View>
      )}

      {item.specialInstructions && (
        <Text style={styles.instructions} numberOfLines={1}>
          Nota: {item.specialInstructions}
        </Text>
      )}

      <View style={styles.itemFooter}>
        <Text style={styles.itemPrice}>${item.total.toFixed(2)}</Text>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQuantity(item.quantity - 1)}
            activeOpacity={0.8}
          >
            <Ionicons name="remove" size={16} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Card>
);

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const {
    items,
    restaurant,
    subtotal,
    itemCount,
    removeItem,
    updateQuantity,
    clearCart,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
  } | null>(null);

  const deliveryFee = restaurant?.deliveryFee || 25;
  const serviceFee = subtotal * 0.08;
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      Alert.alert(
        'Eliminar producto',
        '¿Estás seguro de que quieres eliminar este producto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(itemId) },
        ],
      );
    } else {
      updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    Alert.alert('Eliminar producto', `¿Quieres eliminar "${productName}" del carrito?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(itemId) },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que quieres vaciar todo el carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar', style: 'destructive', onPress: clearCart },
      ],
    );
  };

  const handleApplyCoupon = () => {
    const code = couponCode.toUpperCase();
    if (code === 'DEVOLON10') {
      const discountAmount = subtotal * 0.1;
      setAppliedCoupon({ code, discount: discountAmount });
      Alert.alert('Cupón aplicado', '10% de descuento aplicado');
    } else if (code === 'ENVIOGRATIS') {
      setAppliedCoupon({ code, discount: deliveryFee });
      Alert.alert('Cupón aplicado', 'Envío gratis aplicado');
    } else if (couponCode.length > 0) {
      Alert.alert('Cupón inválido', 'El código de cupón no es válido');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (restaurant && subtotal < restaurant.minimumOrder) {
      Alert.alert(
        'Pedido mínimo',
        `El pedido mínimo para ${restaurant.name} es de $${restaurant.minimumOrder}. Tu carrito tiene $${subtotal.toFixed(2)}.`,
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  // ============ Empty State ============
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Header title="Carrito" eyebrow="PEDIDO" />
        <EmptyState
          icon="cart-outline"
          title="Tu carrito está vacío"
          subtitle="Agrega productos de tus restaurantes favoritos para comenzar."
          actionLabel="EXPLORAR"
          onAction={() => navigation.navigate('Home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title={`Carrito · ${itemCount}`}
        eyebrow="PEDIDO"
        rightContent={
          <TouchableOpacity
            onPress={handleClearCart}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* ============ Restaurant Pill ============ */}
        {restaurant && (
          <View style={styles.sectionWrap}>
            <Card
              variant="glass"
              onPress={() => navigation.navigate('RestaurantDetail', { restaurant })}
              padding={s.md}
              borderRadius={radius.xl}
              style={styles.restaurantPill}
            >
              <Image source={{ uri: restaurant.logo }} style={styles.restaurantLogo} />
              <View style={styles.restaurantDetails}>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {restaurant.name}
                </Text>
                <View style={styles.restaurantMeta}>
                  <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                  <Text style={styles.restaurantMetaText}>{restaurant.deliveryTime}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.restaurantMetaText}>
                    Mín ${restaurant.minimumOrder}
                  </Text>
                </View>
              </View>
              <View style={styles.addMoreBtn}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </View>
            </Card>
          </View>
        )}

        {/* ============ Items ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>PRODUCTOS</Text>
          <Text style={styles.sectionTitle}>{items.length} en tu carrito</Text>
          {items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={(qty) => handleUpdateQuantity(item.id, qty)}
              onRemove={() => handleRemoveItem(item.id, item.product.name)}
            />
          ))}
        </View>

        {/* ============ Coupon ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>DESCUENTO</Text>
          <Text style={styles.sectionTitle}>Cupón</Text>
          {appliedCoupon ? (
            <Card variant="glass" padding={s.md} borderRadius={radius.lg} style={styles.appliedCoupon}>
              <View style={styles.couponInfo}>
                <View style={styles.couponIconHalo}>
                  <Ionicons name="pricetag" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.couponDiscount}>
                    -${appliedCoupon.discount.toFixed(2)} aplicado
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </Card>
          ) : (
            <View style={styles.couponRow}>
              <View style={{ flex: 1 }}>
                <Input
                  variant="filled"
                  icon="pricetag-outline"
                  placeholder="Ingresa tu código"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
              </View>
              <Button
                label="APLICAR"
                onPress={handleApplyCoupon}
                variant="secondary"
                size="md"
                fullWidth={false}
                style={styles.applyBtn}
              />
            </View>
          )}
          <Text style={styles.couponHint}>Prueba: DEVOLON10 o ENVIOGRATIS</Text>
        </View>

        {/* ============ Summary ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>RESUMEN</Text>
          <Text style={styles.sectionTitle}>Tu total</Text>
          <Card variant="glass" padding={s.lg} borderRadius={radius['2xl']}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Envío</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Servicio (8%)</Text>
              <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
            </View>
            {appliedCoupon && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.success }]}>
                  Descuento
                </Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  -${appliedCoupon.discount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* ============ Floating Checkout CTA ============ */}
      <View style={styles.checkoutFooter}>
        <View style={styles.checkoutTotalBlock}>
          <Text style={styles.checkoutTotalLabel}>TOTAL</Text>
          <Text style={styles.checkoutTotal}>${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout}
          activeOpacity={0.88}
        >
          <Text style={styles.checkoutBtnText}>PAGAR</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  clearText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ SECTIONS ============
  sectionWrap: {
    paddingHorizontal: s.xl,
    marginTop: s.lg,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: s.md,
  },

  // ============ RESTAURANT PILL ============
  restaurantPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  restaurantLogo: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  restaurantDetails: { flex: 1 },
  restaurantName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  restaurantMetaText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.textFaint,
    marginHorizontal: 4,
  },
  addMoreBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ ITEM CARD ============
  itemCard: {
    flexDirection: 'row',
    gap: s.md,
    marginBottom: s.xs,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
  },
  itemContent: { flex: 1 },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: s.xs,
  },
  itemName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  optionsList: { marginTop: 4 },
  optionText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  instructions: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s.sm,
  },
  itemPrice: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    padding: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    minWidth: 28,
    textAlign: 'center',
  },

  // ============ COUPON ============
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  applyBtn: {
    paddingHorizontal: s.lg,
  },
  couponHint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontStyle: 'italic',
    marginTop: s.xs,
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  couponIconHalo: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCode: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: 0.3,
  },
  couponDiscount: {
    color: colors.success,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },

  // ============ SUMMARY ============
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: s.sm,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  summaryValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: s.sm,
  },
  totalLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
  totalValue: {
    color: colors.primary,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
  },

  // ============ CHECKOUT FOOTER ============
  checkoutFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.xl,
    paddingTop: s.md,
    paddingBottom: s['2xl'],
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: s.md,
  },
  checkoutTotalBlock: {
    flex: 1,
  },
  checkoutTotalLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  checkoutTotal: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  checkoutBtn: {
    height: 56,
    paddingHorizontal: s.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    ...shadows.glow,
  },
  checkoutBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
});
