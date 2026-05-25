// ==========================================
// DEVOLÓN — Restaurant Orders
// Lista de pedidos filtrable por tabs de estado, con acciones inline.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ordersApi } from '../../services/api';
import { Order, OrderStatus } from '../../types';
import { Card, Button, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Nuevos' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'ready_for_pickup', label: 'Listos' },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string }> = {
  pending: { label: 'Nuevo', color: colors.primary },
  confirmed: { label: 'Confirmado', color: colors.info },
  preparing: { label: 'Preparando', color: colors.info },
  ready_for_pickup: { label: 'Listo', color: colors.success },
  driver_assigned: { label: 'Repartidor', color: colors.primary },
  picked_up: { label: 'Recogido', color: colors.primary },
  on_the_way: { label: 'En camino', color: colors.primary },
  delivered: { label: 'Entregado', color: colors.success },
  cancelled: { label: 'Cancelado', color: colors.danger },
};

export default function RestaurantOrdersScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      const status = activeTab === 'all' ? undefined : activeTab;
      const data = await ordersApi.getRestaurantOrders(status);
      setOrders(data);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleAcceptOrder = async (order: Order) => {
    Alert.prompt(
      'Tiempo de preparación',
      '¿Cuántos minutos tardará el pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async (minutes) => {
            try {
              await ordersApi.acceptOrder(order.id, parseInt(minutes || '30'));
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'No se pudo aceptar el pedido');
            }
          },
        },
      ],
      'plain-text',
      '30',
    );
  };

  const handleRejectOrder = async (order: Order) => {
    Alert.alert(
      'Rechazar pedido',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            try {
              await ordersApi.rejectOrder(order.id, 'Restaurante no disponible');
              loadOrders();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar el pedido');
            }
          },
        },
      ],
    );
  };

  const handleMarkReady = async (order: Order) => {
    try {
      await ordersApi.markReady(order.id);
      loadOrders();
      Alert.alert('Listo', 'El pedido está listo para recoger');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el pedido');
    }
  };

  const formatCurrency = (amount: number | string | undefined | null) => {
    const n = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(n ?? 0).toFixed(2)}`;
  };
  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  // Abre el chat con uno de los participantes del pedido (cliente o driver).
  const openChat = async (
    order: any,
    role: 'customer' | 'driver',
    fallbackName: string,
  ) => {
    try {
      const { messagesApi } = await import('../../services/api');
      const participants = await messagesApi.getParticipants(order.id);
      const target = participants.find((p: any) => p.role === role);
      if (!target) {
        const { Alert } = await import('react-native');
        Alert.alert(
          role === 'driver' ? 'Aún sin repartidor' : 'Sin cliente disponible',
          role === 'driver'
            ? 'Todavía no hay un repartidor asignado.'
            : 'No se puede contactar al cliente en este momento.',
        );
        return;
      }
      navigation.navigate('Chat', {
        orderId: order.id,
        otherUserId: target.userId,
        otherUserName: fallbackName,
        otherUserRole: role,
        orderNumber: `#${order.orderNumber}`,
      });
    } catch (error: any) {
      const { Alert } = await import('react-native');
      Alert.alert(
        'No se pudo abrir el chat',
        error?.response?.data?.message || 'Intenta de nuevo.',
      );
    }
  };

  const renderOrder = ({ item: order }: { item: Order }) => {
    const sc = STATUS_CONFIG[order.status];
    const customerName =
      order.customer?.name ||
      [order.customer?.firstName, order.customer?.lastName]
        .filter(Boolean)
        .join(' ') ||
      'Cliente';
    const driverName =
      (order as any).driver?.name ||
      [
        (order as any).driver?.firstName,
        (order as any).driver?.lastName,
      ]
        .filter(Boolean)
        .join(' ') ||
      'Repartidor';
    return (
      <Card
        variant="glass"
        padding={s.lg}
        borderRadius={radius.xl}
        onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
        style={styles.orderCard}
      >
        {/* Header */}
        <View style={styles.orderHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
            <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={[styles.statusDot, { backgroundColor: sc.color }]} />
            <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Customer — row con nombre + botón de chat */}
        <View style={styles.customerRow}>
          <View style={styles.customerInfo}>
            <Ionicons name="person-outline" size={14} color={colors.textMuted} />
            <Text style={styles.customerName} numberOfLines={1}>
              {customerName}
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation?.();
              openChat(order, 'customer', customerName);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={styles.chatChip}
          >
            <Ionicons name="chatbubble" size={12} color={colors.primary} />
            <Text style={styles.chatChipText}>MENSAJE</Text>
          </TouchableOpacity>
        </View>

        {/* Driver — solo si hay rider asignado */}
        {(order as any).driverId && (
          <View style={styles.customerRow}>
            <View style={styles.customerInfo}>
              <Ionicons name="bicycle-outline" size={14} color={colors.textMuted} />
              <Text style={styles.customerName} numberOfLines={1}>
                {driverName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                openChat(order, 'driver', driverName);
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={styles.chatChip}
            >
              <Ionicons name="chatbubble" size={12} color={colors.primary} />
              <Text style={styles.chatChipText}>MENSAJE</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Items — el order trae `items` como jsonb snapshot (cart) y
            como relación `order_items`. Usamos lo que esté disponible. */}
        <View style={styles.itemsList}>
          {(order.items || []).slice(0, 3).map((item: any, index: number) => (
            <Text key={index} style={styles.itemText}>
              <Text style={styles.itemQty}>{item.quantity}× </Text>
              {item.product?.name || item.name || 'Producto'}
            </Text>
          ))}
          {(order.items?.length || 0) > 3 && (
            <Text style={styles.moreItems}>
              +{order.items.length - 3} producto
              {order.items.length - 3 === 1 ? '' : 's'} más
            </Text>
          )}
        </View>

        {/* Notas del cliente para cocina ("sin catsup", "sin chile") */}
        {((order as any).customerNotes || (order as any).specialInstructions) && (
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <Ionicons name="restaurant" size={13} color={colors.primary} />
              <Text style={styles.notesEyebrow}>NOTAS DEL CLIENTE</Text>
            </View>
            <Text style={styles.notesText}>
              {(order as any).customerNotes ||
                (order as any).specialInstructions}
            </Text>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.total)}</Text>
        </View>

        {/* Actions */}
        {order.status === 'pending' && (
          <View style={styles.actions}>
            <View style={styles.actionItem}>
              <Button
                label="Rechazar"
                variant="danger"
                size="md"
                icon="close"
                iconPosition="left"
                onPress={() => handleRejectOrder(order)}
              />
            </View>
            <View style={styles.actionItem}>
              <Button
                label="Aceptar"
                variant="primary"
                size="md"
                icon="checkmark"
                iconPosition="left"
                onPress={() => handleAcceptOrder(order)}
              />
            </View>
          </View>
        )}

        {order.status === 'preparing' && (
          <View style={styles.singleAction}>
            <Button
              label="Marcar como listo"
              variant="primary"
              size="md"
              icon="checkmark-circle"
              iconPosition="left"
              onPress={() => handleMarkReady(order)}
            />
          </View>
        )}
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DEVOLÓN · OPERACIÓN</Text>
        <Text style={styles.title}>Pedidos</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_TABS}
          keyExtractor={(t) => t.key}
          contentContainerStyle={styles.tabsList}
          renderItem={({ item: tab }) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.85}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Sin pedidos"
            subtitle="Aún no hay pedidos en este estado."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },

  // ============ TABS ============
  tabsWrap: {
    paddingBottom: s.md,
  },
  tabsList: {
    paddingHorizontal: s.xl,
    gap: s.xs,
  },
  tab: {
    paddingHorizontal: s.md,
    paddingVertical: s.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: s.xs,
  },
  tabActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: colors.primary,
  },

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
    flexGrow: 1,
  },
  orderCard: {
    marginBottom: s.sm,
  },

  // ============ HEADER OF CARD ============
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
  },
  orderNumber: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  orderTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.xs,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
  },
  statusText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
    textTransform: 'uppercase',
  },

  // ============ CUSTOMER / DRIVER ROW ============
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: s.sm,
    gap: s.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  customerName: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  chatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.35)',
  },
  chatChipText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 0.6,
  },

  // ============ ITEMS ============
  itemsList: {
    marginTop: s.sm,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  itemText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  itemQty: {
    color: colors.primary,
    fontWeight: fontWeight.black,
  },
  moreItems: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // ============ NOTAS COCINA ============
  notesCard: {
    backgroundColor: 'rgba(255,194,14,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.40)',
    padding: s.sm,
    borderRadius: radius.md,
    marginTop: s.sm,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  notesEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  notesText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: 18,
  },

  // ============ TOTAL ============
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s.sm,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  totalValue: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },

  // ============ ACTIONS ============
  actions: {
    flexDirection: 'row',
    gap: s.sm,
    marginTop: s.md,
  },
  actionItem: { flex: 1 },
  singleAction: {
    marginTop: s.md,
  },
});
