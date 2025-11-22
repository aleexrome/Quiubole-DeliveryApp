// ==========================================
// CHECKOUT SCREEN - Proceso de Pago
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import paymentService, { PaymentMethod } from '../../services/payments';

// Colores de Quiubole
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  textLight: '#6C757D',
};

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  options?: string[];
}

interface Address {
  id: string;
  name: string;
  street: string;
  neighborhood: string;
  city: string;
  reference?: string;
}

interface CheckoutScreenProps {
  navigation: any;
  route: {
    params: {
      restaurantId: string;
      restaurantName: string;
      items: CartItem[];
      subtotal: number;
      deliveryFee: number;
      serviceFee: number;
    };
  };
}

type PaymentType = 'card' | 'cash' | 'oxxo';

export default function CheckoutScreen({ navigation, route }: CheckoutScreenProps) {
  const { restaurantName, items, subtotal, deliveryFee, serviceFee } = route.params;

  const [loading, setLoading] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('card');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [tip, setTip] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const total = subtotal + deliveryFee + serviceFee + tip - discount;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar métodos de pago
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);

      if (methods.length > 0) {
        const defaultMethod = methods.find((m) => m.isDefault) || methods[0];
        setSelectedPaymentMethod(defaultMethod.id);
      }

      // TODO: Cargar direcciones del usuario
      setAddresses([
        {
          id: '1',
          name: 'Casa',
          street: 'Av. Insurgentes Sur 1234',
          neighborhood: 'Del Valle',
          city: 'CDMX',
          reference: 'Edificio azul, depto 5B',
        },
        {
          id: '2',
          name: 'Oficina',
          street: 'Paseo de la Reforma 500',
          neighborhood: 'Juárez',
          city: 'CDMX',
        },
      ]);
      setSelectedAddress('1');
    } catch (error) {
      console.error('Error loading checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      // TODO: Validar cupón con el backend
      // const result = await api.coupons.validate(couponCode, restaurantId, subtotal);
      setDiscount(50); // Ejemplo: $50 de descuento
      Alert.alert('¡Cupón aplicado!', 'Se aplicó un descuento de $50.00');
    } catch (error) {
      Alert.alert('Error', 'Cupón inválido o expirado');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Error', 'Selecciona una dirección de entrega');
      return;
    }

    if (paymentType === 'card' && !selectedPaymentMethod) {
      Alert.alert('Error', 'Selecciona un método de pago');
      return;
    }

    setProcessingPayment(true);

    try {
      if (paymentType === 'card') {
        // Crear payment intent
        const paymentIntent = await paymentService.createPaymentIntent(
          total,
          'temp_order_id', // En producción, primero crear la orden
          selectedPaymentMethod!,
        );

        if (!paymentIntent) {
          throw new Error('Error al procesar el pago');
        }

        // Verificar estado del pago
        const status = await paymentService.checkPaymentStatus(paymentIntent.id);

        if (status?.status === 'succeeded') {
          // Pago exitoso
          navigation.replace('OrderConfirmation', {
            orderId: status.orderId,
            paymentMethod: 'card',
          });
        } else if (status?.status === 'requires_action') {
          // Requiere 3D Secure - abrir URL de confirmación
          Alert.alert(
            'Verificación requerida',
            'Tu banco requiere verificación adicional. Serás redirigido.',
          );
          // TODO: Manejar 3D Secure
        } else {
          throw new Error('El pago no fue procesado correctamente');
        }
      } else if (paymentType === 'oxxo') {
        // Crear pago OXXO
        const oxxoPayment = await paymentService.createOxxoPayment(total, 'temp_order_id');

        if (!oxxoPayment) {
          throw new Error('Error al generar pago OXXO');
        }

        navigation.replace('OxxoPayment', {
          voucherUrl: oxxoPayment.voucherUrl,
          expiresAt: oxxoPayment.expiresAt.toISOString(),
          amount: total,
        });
      } else {
        // Pago en efectivo
        // TODO: Crear orden con pago en efectivo
        navigation.replace('OrderConfirmation', {
          orderId: 'temp_order_id',
          paymentMethod: 'cash',
          total,
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar el pago');
    } finally {
      setProcessingPayment(false);
    }
  };

  const renderPaymentMethodCard = (method: PaymentMethod) => {
    const brandInfo = paymentService.getCardBrandInfo(method.card.brand);
    const isSelected = selectedPaymentMethod === method.id;

    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.paymentMethodCard, isSelected && styles.paymentMethodCardSelected]}
        onPress={() => {
          setSelectedPaymentMethod(method.id);
          setPaymentType('card');
        }}
      >
        <View style={styles.paymentMethodInfo}>
          <Ionicons name="card" size={24} color={isSelected ? COLORS.primary : COLORS.gray} />
          <View style={styles.paymentMethodDetails}>
            <Text style={styles.paymentMethodBrand}>{brandInfo.name}</Text>
            <Text style={styles.paymentMethodNumber}>•••• {method.card.last4}</Text>
          </View>
        </View>
        {isSelected && <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Resumen del pedido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen del Pedido</Text>
          <Text style={styles.restaurantName}>{restaurantName}</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
              <Text style={styles.orderItemName}>{item.name}</Text>
              <Text style={styles.orderItemPrice}>
                {paymentService.formatAmount(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* Dirección de entrega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dirección de Entrega</Text>
          {addresses.map((address) => (
            <TouchableOpacity
              key={address.id}
              style={[
                styles.addressCard,
                selectedAddress === address.id && styles.addressCardSelected,
              ]}
              onPress={() => setSelectedAddress(address.id)}
            >
              <View style={styles.addressInfo}>
                <Ionicons
                  name={address.name === 'Casa' ? 'home' : 'business'}
                  size={20}
                  color={selectedAddress === address.id ? COLORS.primary : COLORS.gray}
                />
                <View style={styles.addressDetails}>
                  <Text style={styles.addressName}>{address.name}</Text>
                  <Text style={styles.addressStreet}>{address.street}</Text>
                  <Text style={styles.addressCity}>
                    {address.neighborhood}, {address.city}
                  </Text>
                </View>
              </View>
              {selectedAddress === address.id && (
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddAddress')}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Agregar nueva dirección</Text>
          </TouchableOpacity>
        </View>

        {/* Método de pago */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Método de Pago</Text>

          {/* Tarjetas guardadas */}
          {paymentMethods.map(renderPaymentMethodCard)}

          {/* Agregar tarjeta */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddPaymentMethod')}
          >
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addButtonText}>Agregar tarjeta</Text>
          </TouchableOpacity>

          {/* Efectivo */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentType === 'cash' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => {
              setPaymentType('cash');
              setSelectedPaymentMethod(null);
            }}
          >
            <View style={styles.paymentMethodInfo}>
              <Ionicons
                name="cash"
                size={24}
                color={paymentType === 'cash' ? COLORS.primary : COLORS.gray}
              />
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodBrand}>Efectivo</Text>
                <Text style={styles.paymentMethodNumber}>Paga al recibir</Text>
              </View>
            </View>
            {paymentType === 'cash' && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>

          {/* OXXO Pay */}
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              paymentType === 'oxxo' && styles.paymentMethodCardSelected,
            ]}
            onPress={() => {
              setPaymentType('oxxo');
              setSelectedPaymentMethod(null);
            }}
          >
            <View style={styles.paymentMethodInfo}>
              <Ionicons
                name="storefront"
                size={24}
                color={paymentType === 'oxxo' ? COLORS.primary : COLORS.gray}
              />
              <View style={styles.paymentMethodDetails}>
                <Text style={styles.paymentMethodBrand}>OXXO Pay</Text>
                <Text style={styles.paymentMethodNumber}>Paga en cualquier OXXO</Text>
              </View>
            </View>
            {paymentType === 'oxxo' && (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Propina */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Propina para el repartidor</Text>
          <View style={styles.tipContainer}>
            {[0, 10, 20, 30, 50].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.tipButton, tip === amount && styles.tipButtonSelected]}
                onPress={() => setTip(amount)}
              >
                <Text style={[styles.tipButtonText, tip === amount && styles.tipButtonTextSelected]}>
                  {amount === 0 ? 'Sin propina' : `$${amount}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cupón */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cupón de descuento</Text>
          <View style={styles.couponContainer}>
            <TextInput
              style={styles.couponInput}
              placeholder="Ingresa tu código"
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.couponButton} onPress={applyCoupon}>
              <Text style={styles.couponButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instrucciones especiales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instrucciones especiales</Text>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Ej: Sin cebolla, extra salsa..."
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Desglose de precios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Desglose</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>{paymentService.formatAmount(subtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Envío</Text>
            <Text style={styles.priceValue}>{paymentService.formatAmount(deliveryFee)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tarifa de servicio</Text>
            <Text style={styles.priceValue}>{paymentService.formatAmount(serviceFee)}</Text>
          </View>
          {tip > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Propina</Text>
              <Text style={styles.priceValue}>{paymentService.formatAmount(tip)}</Text>
            </View>
          )}
          {discount > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Descuento</Text>
              <Text style={[styles.priceValue, styles.discountText]}>
                -{paymentService.formatAmount(discount)}
              </Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{paymentService.formatAmount(total)}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón de pagar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={processingPayment}
        >
          {processingPayment ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.payButtonText}>
                {paymentType === 'cash'
                  ? 'Confirmar Pedido'
                  : paymentType === 'oxxo'
                    ? 'Generar Ficha OXXO'
                    : 'Pagar'}{' '}
                {paymentService.formatAmount(total)}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    width: 30,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  addressCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5F0',
  },
  addressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  addressDetails: {
    marginLeft: 12,
    flex: 1,
  },
  addressName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  addressStreet: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  addressCity: {
    fontSize: 12,
    color: COLORS.gray,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentMethodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFF5F0',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodDetails: {
    marginLeft: 12,
  },
  paymentMethodBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  paymentMethodNumber: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  tipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  tipButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  tipButtonText: {
    fontSize: 14,
    color: COLORS.text,
  },
  tipButtonTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  couponContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  couponButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  couponButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  priceValue: {
    fontSize: 14,
    color: COLORS.text,
  },
  discountText: {
    color: COLORS.success,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginTop: 8,
    paddingTop: 12,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  payButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
