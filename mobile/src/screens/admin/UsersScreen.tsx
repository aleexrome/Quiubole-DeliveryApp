// ==========================================
// GESTION DE USUARIOS (ADMIN)
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { adminApi } from '../../services/api';
import { User, UserRole } from '../../types';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const loadUsers = async () => {
    try {
      const params = roleFilter === 'all' ? {} : { role: roleFilter };
      const data = await adminApi.getUsers({ ...params, search: searchQuery });
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleBanUser = (user: User) => {
    Alert.prompt(
      'Bloquear Usuario',
      `¿Por que quieres bloquear a ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await adminApi.banUser(user.id, reason || 'Violacion de terminos');
              loadUsers();
              Alert.alert('Usuario bloqueado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo bloquear el usuario');
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'customer': return '#3B82F6';
      case 'restaurant': return '#EC4899';
      case 'driver': return '#8B5CF6';
      case 'admin': return '#EF4444';
      default: return '#666';
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'customer': return 'Cliente';
      case 'restaurant': return 'Negocio';
      case 'driver': return 'Repartidor';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const renderUser = ({ item: user }: { item: User }) => (
    <TouchableOpacity style={styles.userCard}>
      <Image
        source={{ uri: user.avatar || 'https://via.placeholder.com/50' }}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) + '20' }]}>
            <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
              {getRoleName(user.role)}
            </Text>
          </View>
          {user.emailVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => handleBanUser(user)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filters: { key: UserRole | 'all'; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'customer', label: 'Clientes' },
    { key: 'restaurant', label: 'Negocios' },
    { key: 'driver', label: 'Repartidores' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadUsers}
        />
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterBtn, roleFilter === filter.key && styles.filterBtnActive]}
            onPress={() => setRoleFilter(filter.key)}
          >
            <Text style={[styles.filterText, roleFilter === filter.key && styles.filterTextActive]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={64} color="#E5E5E5" />
            <Text style={styles.emptyText}>No hay usuarios</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E5E5',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuBtn: {
    padding: 8,
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
