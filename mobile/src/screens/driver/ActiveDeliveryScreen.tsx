// ==========================================
// PANTALLA DE ENTREGA ACTIVA
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ordersApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';

const DELIVERY_STEPS = [
  { status: 'driver_assigned', label: 'Ir al restaurante', icon: 'restaurant' },
  { status: 'picked_up', label: 'Recoger pedido', icon: 'bag-check' },
  { status: 'on_the_way', label: 'Entregar al cliente', icon: 'location' },
  { status: 'delivered', label: 'Entrega completada', icon: 'checkmark-circle' },
];

export default function ActiveDeliveryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const data = await ordersApi.getById(orderId);
      setOrder(data);
      updateCurrentStep(data.status);
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const updateCurrentStep = (status: OrderStatus) => {
    const stepIndex = DELIVERY_STEPS.findIndex(s => s.status === status);
    setCurrentStep(stepIndex >= 0 ? stepIndex : 0);
  };

  const handlePickedUp = async () => {
    Alert.alert(
      'Confirmar Recogida',
      '¿Ya recogiste el pedido del restaurante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Si, lo tengo',
          onPress: async () => {
            try {
              await ordersApi.markPickedUp(orderId);
              loadOrder();
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar el pedido');
            }
          },
        },
      ]
    );
  };

  const handleDelivered = async () => {
    Alert.alert(
      'Confirmar Entrega',
      '¿Ya entregaste el pedido al cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Si, entregado',
          onPress: async () => {
            try {
              await ordersApi.markDelivered(orderId);
              Alert.alert(
                'Entrega Completada',
                '¡Excelente trabajo! El pago se agregara a tus ganancias.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              Alert.alert('Error', 'No se pudo completar la entrega');
            }
          },
        },
      ]
    );
  };

  const openMaps = (lat: number, lng: number, label: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  const callPhone = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAtRestaurant = order.status === 'driver_assigned' || order.status === 'ready_for_pickup';
  const isOnTheWay = order.status === 'picked_up' || order.status === 'on_the_way';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.orderNumber}>Pedido #{order.orderNumber}</Text>
        <TouchableOpacity>
          <Ionicons name="ellipsis-vertical" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        {/* Progress Steps */}
        <View style={styles.stepsContainer}>
          {DELIVERY_STEPS.map((step, index) => (
            <View key={step.status} style={styles.stepRow}>
              <View style={styles.stepIndicator}>
                <View
                  style={[
                    styles.stepDot,
                    index <= currentStep && styles.stepDotActive,
                    index === currentStep && styles.stepDotCurrent,
                  ]}
                >
                  {index < currentStep ? (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  ) : (
                    <Ionicons
                      name={step.icon as any}
                      size={16}
                      color={index <= currentStep ? '#fff' : '#ccc'}
                    />
                  )}
                </View>
                {index < DELIVERY_STEPS.length - 1 && (
                  <View
                    style={[
                      styles.stepLine,
                      index < currentStep && styles.stepLineActive,
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  index <= currentStep && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Current Task Card */}
        <View style={styles.taskCard}>
          {isAtRestaurant ? (
            <>
              <View style={styles.taskHeader}>
                <Ionicons name="restaurant" size={32} color="#FF6B35" />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>Recoger en</Text>
                  <Text style={styles.taskName}>{order.restaurant.name}</Text>
                </View>
              </View>
              <Text style={styles.taskAddress}>{order.restaurant.address.street}</Text>
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={styles.taskBtn}
                  onPress={() => callPhone(order.restaurant.phone)}
                >
                  <Ionicons name="call" size={20} color="#FF6B35" />
                  <Text style={styles.taskBtnText}>Llamar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.taskBtn, styles.taskBtnPrimary]}
                  onPress={() => openMaps(
                    order.restaurant.address.location.latitude,
                    order.restaurant.address.location.longitude,
                    order.restaurant.name
                  )}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.taskBtnTextPrimary}>Navegar</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.taskHeader}>
                <Ionicons name="location" size={32} color="#22C55E" />
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>Entregar a</Text>
                  <Text style={styles.taskName}>{order.customer.name}</Text>
                </View>
              </View>
              <Text style={styles.taskAddress}>
                {order.deliveryAddress.street} {order.deliveryAddress.number}
              </Text>
              {order.deliveryAddress.reference && (
                <Text style={styles.taskReference}>
                  Ref: {order.deliveryAddress.reference}
                </Text>
              )}
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={styles.taskBtn}
                  onPress={() => callPhone(order.customer.phone)}
                >
                  <Ionicons name="call" size={20} color="#FF6B35" />
                  <Text style={styles.taskBtnText}>Llamar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.taskBtn, styles.taskBtnPrimary]}
                  onPress={() => openMaps(
                    order.deliveryAddress.location.latitude,
                    order.deliveryAddress.location.longitude,
                    'Cliente'
                  )}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.taskBtnTextPrimary}>Navegar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Order Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Detalles del Pedido</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.product.name}</Text>
            </View>
          ))}
          {order.specialInstructions && (
            <View style={styles.instructions}>
              <Ionicons name="chatbubble-outline" size={16} color="#FF6B35" />
              <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
            </View>
          )}
        </View>

        {/* Payment Info */}
        <View style={styles.paymentCard}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Metodo de pago</Text>
            <View style={styles.paymentMethod}>
              <Ionicons
                name={order.paymentMethod === 'cash' ? 'cash' : 'card'}
                size={16}
                color="#666"
              />
              <Text style={styles.paymentMethodText}>
                {order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
              </Text>
            </View>
          </View>
          {order.paymentMethod === 'cash' && (
            <View style={styles.cashWarning}>
              <Ionicons name="warning" size={16} color="#EAB308" />
              <Text style={styles.cashWarningText}>
                Cobrar {formatCurrency(order.total)} en efectivo
              </Text>
            </View>
          )}
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Tu ganancia</Text>
            <Text style={styles.earningsValue}>
              {formatCurrency(order.deliveryFee + (order.tip || 0))}
            </Text>
          </View>
          {order.tip > 0 && (
            <Text style={styles.tipText}>Incluye propina de {formatCurrency(order.tip)}</Text>
          )}
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {isAtRestaurant ? (
          <TouchableOpacity style={styles.actionBtn} onPress={handlePickedUp}>
            <Ionicons name="bag-check" size={24} color="#fff" />
            <Text style={styles.actionBtnText}>Confirmar Recogida</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDelivered]}
            onPress={handleDelivered}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.actionBtnText}>Confirmar Entrega</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  stepsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIndicator: {
    alignItems: 'center',
    marginRight: 12,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#22C55E',
  },
  stepDotCurrent: {
    backgroundColor: '#FF6B35',
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E5E5E5',
    marginVertical: 4,
  },
  stepLineActive: {
    backgroundColor: '#22C55E',
  },
  stepLabel: {
    fontSize: 14,
    color: '#999',
    paddingTop: 6,
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '500',
  },
  taskCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfo: {
    marginLeft: 12,
  },
  taskTitle: {
    fontSize: 12,
    color: '#666',
  },
  taskName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  taskAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  taskReference: {
    fontSize: 12,
    color: '#FF6B35',
    marginTop: 4,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  taskBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
    gap: 8,
  },
  taskBtnText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  taskBtnPrimary: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  taskBtnTextPrimary: {
    color: '#fff',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    width: 30,
  },
  itemName: {
    fontSize: 14,
    color: '#0F172A',
    flex: 1,
  },
  instructions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF5F0',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  instructionsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  paymentCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodText: {
    fontSize: 14,
    color: '#0F172A',
    marginLeft: 6,
  },
  cashWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  cashWarningText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: 8,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  earningsLabel: {
    fontSize: 16,
    color: '#0F172A',
  },
  earningsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  actionContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnDelivered: {
    backgroundColor: '#22C55E',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
