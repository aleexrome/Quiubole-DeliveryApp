// ==========================================
// CART SCREEN - CARRITO DE COMPRAS
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCartStore, CartItem } from '../../store/cartStore';

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
  danger: '#F44336',
};

// Componente de item del carrito
const CartItemCard = ({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}) => (
  <View style={styles.cartItem}>
    <Image source={{ uri: item.product.image }} style={styles.itemImage} />
    <View style={styles.itemContent}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Opciones seleccionadas */}
      {item.selectedOptions.length > 0 && (
        <View style={styles.optionsList}>
          {item.selectedOptions.map((opt, index) => (
            <Text key={index} style={styles.optionText}>
              + {opt.choiceName} {opt.price > 0 && `($${opt.price})`}
            </Text>
          ))}
        </View>
      )}

      {/* Instrucciones especiales */}
      {item.specialInstructions && (
        <Text style={styles.instructions} numberOfLines={1}>
          Nota: {item.specialInstructions}
        </Text>
      )}

      <View style={styles.itemFooter}>
        <Text style={styles.itemPrice}>${item.total.toFixed(2)}</Text>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.quantity - 1)}
          >
            <Ionicons name="remove" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(item.quantity + 1)}
          >
            <Ionicons name="add" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </View>
);

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { items, restaurant, subtotal, itemCount, removeItem, updateQuantity, clearCart } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);

  // Calculos
  const deliveryFee = restaurant?.deliveryFee || 25;
  const serviceFee = subtotal * 0.08; // 8% service fee
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + deliveryFee + serviceFee - discount;

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      Alert.alert(
        'Eliminar producto',
        'Estas seguro de que quieres eliminar este producto?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(itemId) },
        ]
      );
    } else {
      updateQuantity(itemId, quantity);
    }
  };

  const handleRemoveItem = (itemId: string, productName: string) => {
    Alert.alert(
      'Eliminar producto',
      `Quieres eliminar "${productName}" del carrito?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(itemId) },
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vaciar carrito',
      'Estas seguro de que quieres vaciar todo el carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar', style: 'destructive', onPress: clearCart },
      ]
    );
  };

  const handleApplyCoupon = () => {
    // Simular validacion de cupon
    if (couponCode.toUpperCase() === 'QUIUBOLE10') {
      const discountAmount = subtotal * 0.1;
      setAppliedCoupon({ code: couponCode.toUpperCase(), discount: discountAmount });
      Alert.alert('Cupon aplicado', '10% de descuento aplicado');
    } else if (couponCode.toUpperCase() === 'ENVIOGRATIS') {
      setAppliedCoupon({ code: couponCode.toUpperCase(), discount: deliveryFee });
      Alert.alert('Cupon aplicado', 'Envio gratis aplicado');
    } else if (couponCode.length > 0) {
      Alert.alert('Cupon invalido', 'El codigo de cupon no es valido');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (restaurant && subtotal < restaurant.minimumOrder) {
      Alert.alert(
        'Pedido minimo',
        `El pedido minimo para ${restaurant.name} es de $${restaurant.minimumOrder}. Tu carrito tiene $${subtotal.toFixed(2)}.`
      );
      return;
    }
    navigation.navigate('Checkout');
  };

  // Carrito vacio
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mi Carrito</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.lightGray} />
          <Text style={styles.emptyTitle}>Tu carrito esta vacio</Text>
          <Text style={styles.emptySubtitle}>
            Agrega productos de tus restaurantes favoritos
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exploreButtonText}>Explorar restaurantes</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Carrito ({itemCount})</Text>
        <TouchableOpacity onPress={handleClearCart} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Restaurante info */}
        {restaurant && (
          <View style={styles.restaurantInfo}>
            <Image source={{ uri: restaurant.logo }} style={styles.restaurantLogo} />
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <View style={styles.restaurantMeta}>
                <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                <Text style={styles.restaurantMetaText}>{restaurant.deliveryTime}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.restaurantMetaText}>Min ${restaurant.minimumOrder}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('RestaurantDetail', { restaurant })}>
              <Ionicons name="add-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Items del carrito */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Productos ({items.length})</Text>
          {items.map(item => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={(qty) => handleUpdateQuantity(item.id, qty)}
              onRemove={() => handleRemoveItem(item.id, item.product.name)}
            />
          ))}
        </View>

        {/* Cupon */}
        <View style={styles.couponSection}>
          <Text style={styles.sectionTitle}>Cupon de descuento</Text>
          {appliedCoupon ? (
            <View style={styles.appliedCoupon}>
              <View style={styles.couponInfo}>
                <Ionicons name="pricetag" size={20} color={COLORS.success} />
                <View style={styles.couponTextContainer}>
                  <Text style={styles.couponCode}>{appliedCoupon.code}</Text>
                  <Text style={styles.couponDiscount}>-${appliedCoupon.discount.toFixed(2)}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Ionicons name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.couponInput}>
              <TextInput
                style={styles.couponTextInput}
                placeholder="Ingresa tu codigo"
                placeholderTextColor={COLORS.gray}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyCoupon}>
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.couponHint}>Prueba: QUIUBOLE10 o ENVIOGRATIS</Text>
        </View>

        {/* Resumen */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen del pedido</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Costo de envio</Text>
              <Text style={styles.summaryValue}>${deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tarifa de servicio (8%)</Text>
              <Text style={styles.summaryValue}>${serviceFee.toFixed(2)}</Text>
            </View>
            {appliedCoupon && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: COLORS.success }]}>Descuento</Text>
                <Text style={[styles.summaryValue, { color: COLORS.success }]}>
                  -${appliedCoupon.discount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Padding bottom */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutButtonText}>Ir a pagar</Text>
          <Text style={styles.checkoutTotal}>${total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearButtonText: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginTop: 8,
  },
  restaurantLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  restaurantDetails: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  restaurantMetaText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  dot: {
    color: COLORS.gray,
    marginHorizontal: 6,
  },
  itemsContainer: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  cartItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  optionsList: {
    marginTop: 4,
  },
  optionText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  instructions: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  quantityButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 12,
  },
  couponSection: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    padding: 16,
  },
  couponInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponTextInput: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginLeft: 8,
  },
  applyButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
  },
  couponHint: {
    fontSize: 11,
    color: COLORS.gray,
    marginTop: 8,
    fontStyle: 'italic',
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponTextContainer: {
    marginLeft: 8,
  },
  couponCode: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  couponDiscount: {
    fontSize: 12,
    color: COLORS.gray,
  },
  summarySection: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray,
    opacity: 0.3,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  checkoutTotal: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  exploreButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  exploreButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
