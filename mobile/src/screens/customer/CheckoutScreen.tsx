// ==========================================
// DEVOLÓN — Checkout
//
// Flujo de pago dark. Header con back, secciones organizadas como Section
// + Cards glass: resumen del pedido, direcciones seleccionables, métodos
// de pago (tarjeta/efectivo/oxxo), propina pills, cupón Input filled,
// instrucciones, desglose con total hero. CTA flotante "CONFIRMAR PEDIDO".
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import paymentService, { PaymentMethod } from '../../services/payments';
import { ordersApi, devoCouponsApi, addressesApi } from '../../services/api';
import { Button, Card, Header, Input } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

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
  // customerNotes: para el restaurante ("sin catsup", "sin chile")
  // deliveryInstructions: para el rider ("depto 2B, timbre roto")
  const [customerNotes, setCustomerNotes] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Cupones Devo disponibles del usuario + selección actual + preview de descuento.
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [selectedDevoCouponId, setSelectedDevoCouponId] = useState<
    string | null
  >(null);
  const [devoDiscount, setDevoDiscount] = useState(0);
  const [devoDeliveryDiscount, setDevoDeliveryDiscount] = useState(0);

  const total =
    subtotal +
    Math.max(0, deliveryFee - devoDeliveryDiscount) +
    serviceFee +
    tip -
    discount -
    devoDiscount;

  useEffect(() => {
    loadData();
    loadDevoCoupons();
  }, []);

  const loadDevoCoupons = async () => {
    try {
      const data = await devoCouponsApi.getMy();
      // Solo mostramos cupones 'active' (no pending_admin, no redimidos).
      const active = (data.coupons || []).filter(
        (c: any) => c.status === 'active',
      );
      setAvailableCoupons(active);
    } catch (e) {
      // silent
    }
  };

  // Cuando el usuario toca un cupón, validamos contra el backend para
  // obtener el descuento exacto. Si no aplica (ej. subtotal mínimo no
  // alcanzado), mostramos el error y no aplicamos.
  const applyDevoCoupon = async (couponId: string | null) => {
    if (!couponId) {
      setSelectedDevoCouponId(null);
      setDevoDiscount(0);
      setDevoDeliveryDiscount(0);
      return;
    }
    try {
      const preview = await devoCouponsApi.preview(couponId, {
        subtotal,
        deliveryFee,
        restaurantId: route.params.restaurantId,
        productIds: items.map((i) => i.id),
      });
      setSelectedDevoCouponId(couponId);
      setDevoDiscount(Number(preview.discount) || 0);
      setDevoDeliveryDiscount(Number(preview.deliveryDiscount) || 0);
    } catch (e: any) {
      Alert.alert(
        'Cupón no aplica',
        e?.response?.data?.message ||
          'Este cupón no aplica para tu pedido actual.',
      );
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);

      if (methods.length > 0) {
        const defaultMethod = methods.find((m) => m.isDefault) || methods[0];
        setSelectedPaymentMethod(defaultMethod.id);
      }

      // Cargar direcciones reales del backend. Si el usuario no tiene
      // ninguna, le dejamos un Alert sugiriendo crear una desde su perfil.
      try {
        const real = await addressesApi.getMyAddresses();
        const list = Array.isArray(real) ? real : [];
        // Mapeo a la forma esperada por el componente local.
        const mapped = list.map((a: any) => ({
          id: a.id,
          name:
            (a.label === 'home' && 'Casa') ||
            (a.label === 'work' && 'Oficina') ||
            (a.label === 'other' && 'Otra') ||
            a.label ||
            'Sin nombre',
          street: a.street,
          neighborhood: '',
          city: a.city || '',
          reference: a.instructions || '',
        }));
        setAddresses(mapped);
        // Seleccionar la default si existe.
        const def = list.find((a: any) => a.isDefault);
        if (def) setSelectedAddress(def.id);
        else if (list[0]) setSelectedAddress(list[0].id);
      } catch (e) {
        // Si el backend no responde, dejamos array vacío — el user
        // verá el empty state y puede ir a su perfil a crear una.
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      setDiscount(50);
      Alert.alert('Cupón aplicado', 'Se aplicó un descuento de $50.00');
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
        const paymentIntent = await paymentService.createPaymentIntent(
          total,
          'temp_order_id',
          selectedPaymentMethod!,
        );

        if (!paymentIntent) {
          throw new Error('Error al procesar el pago');
        }

        const status = await paymentService.checkPaymentStatus(paymentIntent.id);

        if (status?.status === 'succeeded') {
          navigation.replace('OrderConfirmation', {
            orderId: status.orderId,
            paymentMethod: 'card',
          });
        } else if (status?.status === 'requires_action') {
          Alert.alert(
            'Verificación requerida',
            'Tu banco requiere verificación adicional. Serás redirigido.',
          );
        } else {
          throw new Error('El pago no fue procesado correctamente');
        }
      } else if (paymentType === 'oxxo') {
        const oxxoPayment = await paymentService.createOxxoPayment(total, 'temp_order_id');
        if (!oxxoPayment) throw new Error('Error al generar pago OXXO');

        navigation.replace('OxxoPayment', {
          voucherUrl: oxxoPayment.voucherUrl,
          expiresAt: oxxoPayment.expiresAt.toISOString(),
          amount: total,
        });
      } else {
        // Cash: creamos la orden real en backend con las notas del cliente.
        // Tomamos coords de la dirección seleccionada (mock por ahora).
        const addr = addresses.find((a) => a.id === selectedAddress);
        const order = await ordersApi.create({
          restaurantId: route.params.restaurantId,
          items: items.map((it) => ({
            productId: it.id,
            quantity: it.quantity,
          })),
          deliveryAddress: addr
            ? `${addr.street}, ${addr.neighborhood}, ${addr.city}`
            : 'Sin dirección',
          deliveryLatitude: 19.4326,
          deliveryLongitude: -99.1332,
          customerNotes: customerNotes.trim() || undefined,
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          paymentMethod: 'cash',
          tip,
          couponCode: discount > 0 ? couponCode : undefined,
          devoCouponId: selectedDevoCouponId || undefined,
        });
        navigation.replace('OrderConfirmation', {
          orderId: order?.id || 'temp_order_id',
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
    const isSelected = selectedPaymentMethod === method.id && paymentType === 'card';

    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.optionCard, isSelected && styles.optionCardSelected]}
        onPress={() => {
          setSelectedPaymentMethod(method.id);
          setPaymentType('card');
        }}
        activeOpacity={0.85}
      >
        <View style={styles.optionLeft}>
          <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
            <Ionicons
              name="card"
              size={18}
              color={isSelected ? colors.primary : colors.textMuted}
            />
          </View>
          <View>
            <Text style={styles.optionTitle}>{brandInfo.name}</Text>
            <Text style={styles.optionSubtitle}>•••• {method.card.last4}</Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const ctaLabel =
    paymentType === 'cash'
      ? `CONFIRMAR · ${paymentService.formatAmount(total)}`
      : paymentType === 'oxxo'
      ? `GENERAR FICHA · ${paymentService.formatAmount(total)}`
      : `PAGAR · ${paymentService.formatAmount(total)}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Checkout" eyebrow="PASO FINAL" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* ============ Order Summary ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>RESUMEN</Text>
          <Text style={styles.sectionTitle}>Tu pedido</Text>
          <Card variant="glass" padding={s.lg} borderRadius={radius.xl}>
            <Text style={styles.restaurantName}>{restaurantName}</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.orderItem}>
                <Text style={styles.orderItemQuantity}>{item.quantity}×</Text>
                <Text style={styles.orderItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.orderItemPrice}>
                  {paymentService.formatAmount(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </Card>
        </View>

        {/* ============ Address ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>ENTREGA</Text>
          <Text style={styles.sectionTitle}>Dirección</Text>
          {addresses.map((address) => {
            const isSelected = selectedAddress === address.id;
            return (
              <TouchableOpacity
                key={address.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelectedAddress(address.id)}
                activeOpacity={0.85}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                    <Ionicons
                      name={address.name === 'Casa' ? 'home' : 'business'}
                      size={18}
                      color={isSelected ? colors.primary : colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{address.name}</Text>
                    <Text style={styles.optionSubtitle} numberOfLines={1}>
                      {address.street}
                    </Text>
                    <Text style={styles.optionFaint} numberOfLines={1}>
                      {address.neighborhood}, {address.city}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={styles.addRow}
            onPress={() => navigation.navigate('AddAddress')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addRowText}>Agregar nueva dirección</Text>
          </TouchableOpacity>
        </View>

        {/* ============ Payment ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>PAGO</Text>
          <Text style={styles.sectionTitle}>Método</Text>

          {paymentMethods.map(renderPaymentMethodCard)}

          <TouchableOpacity
            style={styles.addRow}
            onPress={() => navigation.navigate('AddPaymentMethod')}
            activeOpacity={0.85}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addRowText}>Agregar tarjeta</Text>
          </TouchableOpacity>

          {/* Cash */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              paymentType === 'cash' && styles.optionCardSelected,
            ]}
            onPress={() => {
              setPaymentType('cash');
              setSelectedPaymentMethod(null);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.optionIcon,
                  paymentType === 'cash' && styles.optionIconSelected,
                ]}
              >
                <Ionicons
                  name="cash"
                  size={18}
                  color={paymentType === 'cash' ? colors.primary : colors.textMuted}
                />
              </View>
              <View>
                <Text style={styles.optionTitle}>Efectivo</Text>
                <Text style={styles.optionSubtitle}>Paga al recibir</Text>
              </View>
            </View>
            {paymentType === 'cash' && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>

          {/* OXXO */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              paymentType === 'oxxo' && styles.optionCardSelected,
            ]}
            onPress={() => {
              setPaymentType('oxxo');
              setSelectedPaymentMethod(null);
            }}
            activeOpacity={0.85}
          >
            <View style={styles.optionLeft}>
              <View
                style={[
                  styles.optionIcon,
                  paymentType === 'oxxo' && styles.optionIconSelected,
                ]}
              >
                <Ionicons
                  name="storefront"
                  size={18}
                  color={paymentType === 'oxxo' ? colors.primary : colors.textMuted}
                />
              </View>
              <View>
                <Text style={styles.optionTitle}>OXXO Pay</Text>
                <Text style={styles.optionSubtitle}>Paga en cualquier OXXO</Text>
              </View>
            </View>
            {paymentType === 'oxxo' && (
              <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* ============ Tip ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>EXTRA</Text>
          <Text style={styles.sectionTitle}>Propina para el repartidor</Text>
          <View style={styles.tipRow}>
            {[0, 10, 20, 30, 50].map((amount) => {
              const active = tip === amount;
              return (
                <TouchableOpacity
                  key={amount}
                  style={[styles.tipPill, active && styles.tipPillActive]}
                  onPress={() => setTip(amount)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.tipText, active && styles.tipTextActive]}>
                    {amount === 0 ? 'Sin propina' : `$${amount}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ============ Devo Cupones del usuario ============
            Mostramos los cupones personales del cliente (los que ganó
            por puntos). Tap para aplicarlo. Solo uno a la vez. */}
        {availableCoupons.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionEyebrow}>DEVO CUPONES</Text>
            <Text style={styles.sectionTitle}>Tus cupones</Text>
            {availableCoupons.map((c) => {
              const isSelected = selectedDevoCouponId === c.id;
              const headline =
                c.type === 'percentage'
                  ? `${c.value}% OFF${c.maxDiscount ? ` (hasta $${Number(c.maxDiscount).toFixed(0)})` : ''}`
                  : c.type === 'fixed'
                    ? `$${Number(c.value).toFixed(0)} OFF`
                    : c.type === 'free_delivery'
                      ? 'ENVÍO GRATIS'
                      : c.type === 'product_discount'
                        ? `$${Number(c.value).toFixed(0)} en producto`
                        : 'Cupón Devo';
              return (
                <TouchableOpacity
                  key={c.id}
                  activeOpacity={0.85}
                  onPress={() => applyDevoCoupon(isSelected ? null : c.id)}
                  style={[
                    styles.devoCouponRow,
                    isSelected && styles.devoCouponRowSelected,
                  ]}
                >
                  <View style={styles.devoCouponIcon}>
                    <Ionicons
                      name={
                        c.type === 'free_delivery'
                          ? 'bicycle'
                          : c.type === 'percentage'
                            ? 'pricetag'
                            : 'gift'
                      }
                      size={18}
                      color={isSelected ? colors.onPrimary : colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.devoCouponHeadline,
                        isSelected && { color: colors.onPrimary },
                      ]}
                    >
                      {headline}
                    </Text>
                    {c.description && (
                      <Text
                        style={[
                          styles.devoCouponSub,
                          isSelected && { color: colors.onPrimary },
                        ]}
                      >
                        {c.description}
                      </Text>
                    )}
                  </View>
                  {isSelected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.onPrimary}
                    />
                  ) : (
                    <View style={styles.devoCouponPickHint}>
                      <Text style={styles.devoCouponPickHintText}>USAR</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ============ Coupon code (promociones globales) ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>CÓDIGO PROMOCIONAL</Text>
          <Text style={styles.sectionTitle}>¿Tienes un código?</Text>
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
              onPress={applyCoupon}
              variant="secondary"
              size="md"
              fullWidth={false}
              style={styles.applyBtn}
            />
          </View>
        </View>

        {/* ============ Notas para el restaurante ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>NOTAS</Text>
          <Text style={styles.sectionTitle}>Para el restaurante</Text>
          <Text style={styles.sectionHint}>
            Indica si quieres algo sin algún ingrediente, extra de salsa,
            término de la carne, etc.
          </Text>
          <Input
            variant="filled"
            placeholder="Ej: Hamburguesas sin catsup, una sin chile…"
            value={customerNotes}
            onChangeText={setCustomerNotes}
            multiline
            numberOfLines={3}
            containerStyle={styles.instructionsBox}
          />
        </View>

        {/* ============ Indicaciones para el repartidor ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>ENTREGA</Text>
          <Text style={styles.sectionTitle}>Para el repartidor</Text>
          <Text style={styles.sectionHint}>
            Cómo llegar a tu domicilio, referencias o cualquier detalle útil.
          </Text>
          <Input
            variant="filled"
            placeholder="Ej: Edificio azul, depto 5B, llamar al llegar…"
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
            containerStyle={styles.instructionsBox}
          />
        </View>

        {/* ============ Breakdown ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>TOTAL</Text>
          <Text style={styles.sectionTitle}>Desglose</Text>
          <Card variant="glass" padding={s.lg} borderRadius={radius['2xl']}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{paymentService.formatAmount(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Envío</Text>
              <Text style={styles.summaryValue}>
                {paymentService.formatAmount(deliveryFee)}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Servicio</Text>
              <Text style={styles.summaryValue}>
                {paymentService.formatAmount(serviceFee)}
              </Text>
            </View>
            {tip > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Propina</Text>
                <Text style={styles.summaryValue}>{paymentService.formatAmount(tip)}</Text>
              </View>
            )}
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.success }]}>
                  Descuento
                </Text>
                <Text style={[styles.summaryValue, { color: colors.success }]}>
                  -{paymentService.formatAmount(discount)}
                </Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>{paymentService.formatAmount(total)}</Text>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* ============ Floating CTA ============ */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payButton, processingPayment && styles.payButtonDisabled]}
          onPress={handlePlaceOrder}
          disabled={processingPayment}
          activeOpacity={0.88}
        >
          {processingPayment ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Text style={styles.payButtonText}>{ctaLabel}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  sectionHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: -s.sm,
    marginBottom: s.sm,
    lineHeight: 18,
  },

  // ============ ORDER SUMMARY ============
  restaurantName: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    textTransform: 'uppercase',
    marginBottom: s.sm,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    paddingVertical: s.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderItemQuantity: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    width: 30,
  },
  orderItemName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  orderItemPrice: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },

  // ============ OPTION CARDS (address/payment) ============
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: s.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    marginBottom: s.xs,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,194,14,0.06)',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.32)',
  },
  optionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  optionFaint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    paddingVertical: s.sm,
    paddingHorizontal: s.xs,
  },
  addRowText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ TIP ============
  tipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  tipPill: {
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipPillActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  tipTextActive: {
    color: colors.primary,
  },

  // ============ COUPON ============
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  applyBtn: { paddingHorizontal: s.lg },

  // ============ DEVO CUPONES ============
  devoCouponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: s.xs,
  },
  devoCouponRowSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  devoCouponIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  devoCouponHeadline: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  devoCouponSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  devoCouponPickHint: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  devoCouponPickHintText: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.6,
  },

  // ============ INSTRUCTIONS ============
  instructionsBox: {
    minHeight: 80,
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

  // ============ BOTTOM CTA ============
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: s.xl,
    paddingTop: s.md,
    paddingBottom: s['2xl'],
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  payButton: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.sm,
    ...shadows.glow,
  },
  payButtonDisabled: {
    opacity: 0.55,
  },
  payButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
});
