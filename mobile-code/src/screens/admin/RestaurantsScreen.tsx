// ==========================================
// GESTION DE RESTAURANTES (ADMIN)
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/api';
import { Restaurant } from '../../types';

export default function AdminRestaurantsScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    loadRestaurants();
  }, [filter]);

  const loadRestaurants = async () => {
    try {
      const data = filter === 'pending'
        ? await adminApi.getPendingRestaurants()
        : await adminApi.getPendingRestaurants(); // TODO: different endpoint
      setRestaurants(data);
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  };

  const handleApprove = async (restaurant: Restaurant) => {
    Alert.alert(
      'Aprobar Negocio',
      `¿Aprobar "${restaurant.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aprobar',
          onPress: async () => {
            try {
              await adminApi.approveRestaurant(restaurant.id);
              loadRestaurants();
              Alert.alert('Exito', 'Negocio aprobado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo aprobar');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (restaurant: Restaurant) => {
    Alert.prompt(
      'Rechazar Negocio',
      '¿Por que rechazas este negocio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await adminApi.rejectRestaurant(restaurant.id, reason || 'No cumple requisitos');
              loadRestaurants();
            } catch (error) {
              Alert.alert('Error', 'No se pudo rechazar');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const renderRestaurant = ({ item: restaurant }: { item: Restaurant }) => (
    <View style={styles.restaurantCard}>
      <Image
        source={{ uri: restaurant.logo || 'https://via.placeholder.com/80' }}
        style={styles.logo}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{restaurant.name}</Text>
        <Text style={styles.category}>{restaurant.category}</Text>
        <Text style={styles.address} numberOfLines={1}>
          {restaurant.address.street}
        </Text>
        <View style={styles.meta}>
          {restaurant.isApproved ? (
            <View style={styles.approvedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              <Text style={styles.approvedText}>Aprobado</Text>
            </View>
          ) : (
            <View style={styles.pendingBadge}>
              <Ionicons name="time" size={14} color="#EAB308" />
              <Text style={styles.pendingText}>Pendiente</Text>
            </View>
          )}
        </View>
      </View>
      {!restaurant.isApproved && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => handleReject(restaurant)}
          >
            <Ionicons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => handleApprove(restaurant)}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Negocios</Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['pending', 'approved', 'all'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobados' : 'Todos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={restaurants}
        renderItem={renderRestaurant}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="restaurant-outline" size={64} color="#E5E5E5" />
            <Text style={styles.emptyText}>No hay negocios</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  filters: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  filterBtnActive: {
    backgroundColor: '#FF6B35',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  restaurantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#E5E5E5',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  category: {
    fontSize: 14,
    color: '#FF6B35',
    marginTop: 2,
  },
  address: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  meta: {
    flexDirection: 'row',
    marginTop: 8,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  approvedText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    color: '#EAB308',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#666',
    marginTop: 12,
  },
});
