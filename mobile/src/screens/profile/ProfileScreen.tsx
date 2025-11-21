import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import { useAuthStore } from '../../context/store';
import type { ProfileStackScreenProps } from '../../navigation/types';

const MENU_ITEMS = [
  { id: 'edit', icon: 'person-outline', title: 'Editar perfil', screen: 'EditProfile' },
  { id: 'addresses', icon: 'location-outline', title: 'Mis direcciones', screen: 'Addresses' },
  { id: 'favorites', icon: 'heart-outline', title: 'Favoritos', screen: 'Favorites' },
  { id: 'payments', icon: 'card-outline', title: 'Métodos de pago', screen: 'PaymentMethods' },
  { id: 'notifications', icon: 'notifications-outline', title: 'Notificaciones', screen: null },
  { id: 'help', icon: 'help-circle-outline', title: 'Ayuda', screen: null },
  { id: 'about', icon: 'information-circle-outline', title: 'Acerca de', screen: null },
];

const ProfileScreen = ({ navigation }: ProfileStackScreenProps<'Profile'>) => {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
  };

  const handleMenuPress = (screen: string | null) => {
    if (screen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      navigation.navigate(screen as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.title}>Perfil</Text>
        </Animated.View>

        {/* User Info */}
        <Animated.View
          style={styles.userCard}
          entering={FadeInDown.delay(100).duration(400)}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || 'U'}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.firstName || 'Usuario'} {user?.lastName || ''}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'email@ejemplo.com'}</Text>
          </View>
          <TouchableOpacity>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </Animated.View>

        {/* Menu Items */}
        <Animated.View
          style={styles.menuSection}
          entering={FadeInDown.delay(200).duration(400)}
        >
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.screen)}
            >
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Logout Button */}
        <Animated.View
          style={styles.logoutSection}
          entering={FadeInDown.delay(300).duration(400)}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.version}>Versión 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.h1, color: colors.text, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, marginHorizontal: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.xl, ...shadows.md },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.h2, color: colors.textInverse },
  userInfo: { flex: 1, marginLeft: spacing.md },
  userName: { ...typography.bodyBold, color: colors.text },
  userEmail: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  menuSection: { backgroundColor: colors.surface, marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: borderRadius.xl, ...shadows.sm },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: { width: 40, height: 40, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight + '15', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  menuTitle: { ...typography.body, color: colors.text, flex: 1 },
  logoutSection: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, backgroundColor: colors.error + '10', borderRadius: borderRadius.lg },
  logoutText: { ...typography.bodyBold, color: colors.error, marginLeft: spacing.sm },
  version: { ...typography.small, color: colors.textLight, textAlign: 'center', marginTop: spacing.xl, marginBottom: spacing.xxl },
});

export default ProfileScreen;
