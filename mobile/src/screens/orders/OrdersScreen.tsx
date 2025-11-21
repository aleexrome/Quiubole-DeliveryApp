import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import type { OrdersStackScreenProps } from '../../navigation/types';

const MOCK_ORDERS = [
  {
    id: '1',
    restaurant: 'Burger Palace',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400',
    items: ['2x Hamburguesa Clásica', '1x Papas Fritas'],
    total: 223,
    status: 'delivered',
    date: '20 Nov 2024',
  },
  {
    id: '2',
    restaurant: 'Sushi Master',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    items: ['1x Combo Especial'],
    total: 350,
    status: 'in_progress',
    date: '21 Nov 2024',
  },
];

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'delivered': return 'Entregado';
    case 'in_progress': return 'En camino';
    case 'preparing': return 'Preparando';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered': return colors.success;
    case 'in_progress': return colors.primary;
    case 'preparing': return colors.warning;
    case 'cancelled': return colors.error;
    default: return colors.textSecondary;
  }
};

const OrderCard = ({ order, onPress, index }: any) => (
  <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
    <TouchableOpacity style={styles.orderCard} onPress={onPress}>
      <Image source={{ uri: order.image }} style={styles.orderImage} />
      <View style={styles.orderContent}>
        <View style={styles.orderHeader}>
          <Text style={styles.restaurantName}>{order.restaurant}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
              {getStatusLabel(order.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.orderItems} numberOfLines={1}>
          {order.items.join(', ')}
        </Text>
        <View style={styles.orderFooter}>
          <Text style={styles.orderDate}>{order.date}</Text>
          <Text style={styles.orderTotal}>${order.total}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  </Animated.View>
);

const OrdersScreen = ({ navigation }: OrdersStackScreenProps<'Orders'>) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View entering={FadeIn.duration(400)}>
        <Text style={styles.title}>Mis pedidos</Text>
      </Animated.View>

      <FlatList
        data={MOCK_ORDERS}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <OrderCard
            order={item}
            index={index}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item.id })}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No tienes pedidos</Text>
            <Text style={styles.emptySubtitle}>
              Tus pedidos aparecerán aquí
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  orderImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  orderContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    ...typography.bodyBold,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.small,
    fontWeight: '600',
  },
  orderItems: {
    ...typography.caption,
    color: colors.textSecondary,
    marginVertical: spacing.xs,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderDate: {
    ...typography.small,
    color: colors.textLight,
  },
  orderTotal: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyEmoji: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
  },
});

export default OrdersScreen;
