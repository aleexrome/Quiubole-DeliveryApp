// ==========================================
// PROFILE SCREEN - PERFIL DEL CLIENTE
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';

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
  danger: '#F44336',
  success: '#4CAF50',
};

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  danger?: boolean;
}

const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true, rightComponent, danger }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon as any} size={20} color={danger ? COLORS.danger : COLORS.primary} />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent || (showArrow && <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />)}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const { clearCart } = useCartStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesion',
      'Estas seguro de que quieres cerrar sesion?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesion',
          style: 'destructive',
          onPress: () => {
            clearCart();
            logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta accion es irreversible. Todos tus datos seran eliminados. Estas seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            // TODO: Implementar eliminacion de cuenta
            Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada exitosamente');
            logout();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <View style={styles.avatarContainer}>
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Usuario'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons
                name={user?.emailVerified ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={user?.emailVerified ? COLORS.success : COLORS.gray}
              />
              <Text style={[styles.verifiedText, { color: user?.emailVerified ? COLORS.success : COLORS.gray }]}>
                {user?.emailVerified ? 'Verificado' : 'Sin verificar'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </TouchableOpacity>

        {/* Quiu Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3</Text>
            <Text style={styles.statLabel}>Favoritos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>$2,450</Text>
            <Text style={styles.statLabel}>Gastado</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="location-outline"
              title="Mis direcciones"
              subtitle="Administra tus direcciones de envio"
              onPress={() => navigation.navigate('Addresses')}
            />
            <MenuItem
              icon="card-outline"
              title="Metodos de pago"
              subtitle="Tarjetas y otros metodos"
              onPress={() => navigation.navigate('PaymentMethods')}
            />
            <MenuItem
              icon="receipt-outline"
              title="Historial de pedidos"
              subtitle="Ver todos tus pedidos"
              onPress={() => navigation.navigate('OrderHistory')}
            />
            <MenuItem
              icon="heart-outline"
              title="Favoritos"
              subtitle="Restaurantes guardados"
              onPress={() => navigation.navigate('Favorites')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              title="Notificaciones"
              subtitle={notificationsEnabled ? 'Activadas' : 'Desactivadas'}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              showArrow={false}
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              }
            />
            <MenuItem
              icon="navigate-outline"
              title="Ubicacion"
              subtitle={locationEnabled ? 'Permitida' : 'Denegada'}
              onPress={() => setLocationEnabled(!locationEnabled)}
              showArrow={false}
              rightComponent={
                <Switch
                  value={locationEnabled}
                  onValueChange={setLocationEnabled}
                  trackColor={{ false: COLORS.lightGray, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              }
            />
            <MenuItem
              icon="language-outline"
              title="Idioma"
              subtitle="Espanol"
              onPress={() => Alert.alert('Idioma', 'Solo disponible en Espanol por ahora')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Soporte</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              title="Centro de ayuda"
              onPress={() => navigation.navigate('Help')}
            />
            <MenuItem
              icon="chatbubble-outline"
              title="Chat de soporte"
              onPress={() => navigation.navigate('SupportChat')}
            />
            <MenuItem
              icon="document-text-outline"
              title="Terminos y condiciones"
              onPress={() => navigation.navigate('Terms')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Politica de privacidad"
              onPress={() => navigation.navigate('Privacy')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sesion</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              title="Cerrar sesion"
              onPress={handleLogout}
              danger
              showArrow={false}
            />
            <MenuItem
              icon="trash-outline"
              title="Eliminar cuenta"
              onPress={handleDeleteAccount}
              danger
              showArrow={false}
            />
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Quiubole! v1.0.0</Text>
          <Text style={styles.versionSubtext}>Hecho con en Mexico</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    marginTop: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginTop: 8,
    padding: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIconDanger: {
    backgroundColor: `${COLORS.danger}15`,
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuTitleDanger: {
    color: COLORS.danger,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  versionSubtext: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 4,
  },
});
