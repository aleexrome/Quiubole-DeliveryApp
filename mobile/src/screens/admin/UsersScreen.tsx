// ==========================================
// DEVOLÓN — Admin Users
//
// Gestión de usuarios global: lista con filtros por rol, búsqueda y
// kebab menu de acciones (promover/degradar/bloquear). Dark dense.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { adminApi } from '../../services/api';
import { User, UserRole } from '../../types';
import { Card, Input, EmptyState } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const ROLE_PRIMARY = colors.primary;
const ROLE_INFO = colors.info;
const ROLE_SUCCESS = colors.success;
const ROLE_DANGER = colors.danger;

type UserStats = {
  all: number;
  customer: number;
  client: number;
  restaurant: number;
  driver: number;
  editor: number;
  admin: number;
};

const EMPTY_STATS: UserStats = {
  all: 0,
  customer: 0,
  client: 0,
  restaurant: 0,
  driver: 0,
  editor: 0,
  admin: 0,
};

export default function AdminUsersScreen() {
  const navigation = useNavigation<any>();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [roleFilter]);

  // Refresca al volver a la tab Usuarios (no quedarse stale tras seeds
  // o cambios desde otra pantalla).
  useFocusEffect(
    useCallback(() => {
      loadUsers();
      loadStats();
    }, [roleFilter]),
  );

  const loadUsers = async () => {
    try {
      const params = roleFilter === 'all' ? {} : { role: roleFilter };
      const data = await adminApi.getUsers({ ...params, search: searchQuery });
      // El api wrapper ya devuelve un array directo (extrae `.data` del
      // payload paginado del backend). Defensivo por si cambia el contrato.
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminApi.getUserStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleBanUser = (user: User) => {
    Alert.prompt(
      'Bloquear usuario',
      `¿Por qué quieres bloquear a ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async (reason) => {
            try {
              await adminApi.banUser(user.id, reason || 'Violación de términos');
              loadUsers();
              Alert.alert('Usuario bloqueado');
            } catch (error) {
              Alert.alert('Error', 'No se pudo bloquear el usuario');
            }
          },
        },
      ],
      'plain-text',
    );
  };

  const promoteToEditor = async (user: User) => {
    try {
      await adminApi.promoteToEditor(user.id);
      Alert.alert('Listo', `${user.name || user.email} ahora es editor.`, [
        {
          text: 'Asignar restaurantes',
          onPress: () => navigation.navigate('AdminEditors'),
        },
        { text: 'OK', style: 'cancel' },
      ]);
      loadUsers();
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'No se pudo promover',
      );
    }
  };

  const demoteFromEditor = (user: User) => {
    Alert.alert(
      'Degradar editor',
      `¿Convertir a ${user.name || user.email} de vuelta en cliente? Se quitarán sus asignaciones.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Degradar',
          style: 'destructive',
          onPress: async () => {
            try {
              await adminApi.demoteEditor(user.id);
              loadUsers();
            } catch (e: any) {
              Alert.alert(
                'Error',
                e?.response?.data?.message || 'No se pudo degradar',
              );
            }
          },
        },
      ],
    );
  };

  const openUserActions = (user: User) => {
    const options: {
      text: string;
      style?: 'default' | 'cancel' | 'destructive';
      onPress?: () => void;
    }[] = [{ text: 'Cancelar', style: 'cancel' }];

    const isClientLike = user.role === 'customer' || user.role === 'client';
    const isEditor = user.role === 'editor';

    if (isClientLike) {
      options.push({
        text: 'Promover a editor',
        onPress: () => promoteToEditor(user),
      });
    }
    if (isEditor) {
      options.push({
        text: 'Ver/editar asignaciones',
        onPress: () => navigation.navigate('AdminEditors'),
      });
      options.push({
        text: 'Degradar a cliente',
        style: 'destructive',
        onPress: () => demoteFromEditor(user),
      });
    }

    options.push({
      text: 'Bloquear',
      style: 'destructive',
      onPress: () => handleBanUser(user),
    });

    Alert.alert(user.name || user.email, 'Selecciona una acción', options);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'customer':
      case 'client':
        return ROLE_INFO;
      case 'restaurant':
        return ROLE_SUCCESS;
      case 'driver':
        return ROLE_PRIMARY;
      case 'admin':
        return ROLE_DANGER;
      case 'editor':
        return ROLE_PRIMARY;
      default:
        return colors.textMuted;
    }
  };

  const getRoleBgRgba = (role: UserRole) => {
    switch (role) {
      case 'customer':
      case 'client':
        return 'rgba(46,144,250,0.12)';
      case 'restaurant':
        return 'rgba(31,174,111,0.12)';
      case 'driver':
        return 'rgba(255,194,14,0.12)';
      case 'admin':
        return 'rgba(229,72,77,0.12)';
      case 'editor':
        return 'rgba(255,194,14,0.12)';
      default:
        return colors.surface;
    }
  };

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'customer':
      case 'client':
        return 'Cliente';
      case 'restaurant':
        return 'Negocio';
      case 'driver':
        return 'Repartidor';
      case 'admin':
        return 'Admin';
      case 'editor':
        return 'Editor';
      default:
        return role;
    }
  };

  // Ícono por rol para el avatar fallback (cuando user.avatar es null).
  // Mantengo el lenguaje visual: cada rol con un símbolo que lo identifica
  // de un vistazo, coloreado con el mismo tinte de su badge.
  const getRoleAvatarIcon = (role: UserRole): keyof typeof Ionicons.glyphMap => {
    // Nota: usar siempre los nombres con sufijo `-outline` o `-sharp`,
    // o el "filled" variant exacto. Algunos íconos como `storefront` SIN
    // sufijo no existen en la versión actual de @expo/vector-icons y se
    // renderizan como signo de interrogación.
    switch (role) {
      case 'customer':
      case 'client':
        return 'person';
      case 'restaurant':
        return 'restaurant-outline';
      case 'driver':
        return 'bicycle';
      case 'admin':
        return 'shield-checkmark';
      case 'editor':
        return 'create-outline';
      default:
        return 'person-outline';
    }
  };

  const renderUser = ({ item: user }: { item: User }) => (
    <Card
      variant="glass"
      padding={s.md}
      borderRadius={radius.xl}
      style={styles.userCard}
    >
      {user.avatar ? (
        <Image source={{ uri: user.avatar }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatarFallback,
            { backgroundColor: getRoleBgRgba(user.role) },
            { borderColor: `${getRoleColor(user.role)}55` },
          ]}
        >
          <Ionicons
            name={getRoleAvatarIcon(user.role)}
            size={22}
            color={getRoleColor(user.role)}
          />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.email}
        </Text>
        <View style={styles.userMeta}>
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: getRoleBgRgba(user.role) },
            ]}
          >
            <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
              {getRoleName(user.role)}
            </Text>
          </View>
          {user.emailVerified && (
            <Ionicons name="checkmark-circle" size={14} color={colors.success} />
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.kebabBtn}
        onPress={() => openUserActions(user)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="ellipsis-vertical"
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
    </Card>
  );

  const filters: { key: UserRole | 'all'; label: string; count: number }[] = [
    { key: 'all', label: 'Todos', count: stats.all },
    { key: 'customer', label: 'Clientes', count: stats.customer },
    { key: 'restaurant', label: 'Negocios', count: stats.restaurant },
    { key: 'driver', label: 'Repartidores', count: stats.driver },
    { key: 'editor', label: 'Editores', count: stats.editor },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GESTIÓN</Text>
        <Text style={styles.title}>Usuarios</Text>
      </View>

      {/* SEARCH */}
      <View style={styles.searchWrap}>
        <Input
          variant="filled"
          icon="search"
          placeholder="Buscar por nombre o email…"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={loadUsers}
          returnKeyType="search"
          rightIcon={searchQuery ? 'close-circle' : undefined}
          onRightIconPress={() => {
            setSearchQuery('');
            loadUsers();
          }}
        />
      </View>

      {/* FILTERS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
        // `flexGrow: 0` evita que el ScrollView herede flex:1 del parent
        // y estire verticalmente a las pills (que con borderRadius:pill
        // se vuelven óvalos gigantes). Forzamos altura natural.
        style={styles.filtersScroll}
      >
        {filters.map((filter) => {
          const active = roleFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              onPress={() => setRoleFilter(filter.key)}
              activeOpacity={0.85}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.filterCount,
                  active && styles.filterCountActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterCountText,
                    active && styles.filterCountTextActive,
                  ]}
                >
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* LIST */}
      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: s.xs }} />}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="Sin usuarios"
            subtitle="No hay usuarios en este filtro."
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ HEADER ============
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

  // ============ SEARCH ============
  searchWrap: {
    paddingHorizontal: s.xl,
    paddingBottom: s.sm,
  },

  // ============ FILTERS ============
  filtersScroll: {
    flexGrow: 0,
  },
  filters: {
    paddingHorizontal: s.xl,
    paddingTop: 4,
    paddingBottom: s.md + 4,
    gap: s.xs,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.md,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  filterTextActive: { color: colors.primary },
  // Badge con conteo dentro de la pill. Estado inactivo: surface tenue.
  // Activo: amarillo brand sólido con número en negro (alto contraste).
  filterCount: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCountActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterCountText: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 0.2,
  },
  filterCountTextActive: { color: colors.onPrimary },

  // ============ LIST ============
  list: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  // Fallback cuando user.avatar es null: círculo con tinte del color
  // del rol + icono semántico. Mejor que un placeholder genérico gris
  // porque identifica el tipo de cuenta a primera vista.
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: { flex: 1 },
  userName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  roleText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  kebabBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
});
