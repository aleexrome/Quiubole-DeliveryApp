// ==========================================
// DEVOLÓN — Customer Profile
//
// Header con avatar + nombre + verificado, stats card, secciones de
// menú con íconos halo y switches premium amarillos.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
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
import { Linking } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightComponent?: React.ReactNode;
  danger?: boolean;
}

const MenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  rightComponent,
  danger,
}: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
    </View>
    <View style={styles.menuBody}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent ?? (showArrow && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />)}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const { clearCart } = useCartStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Devo points + cupones disponibles del cliente. Reemplaza el "GASTADO"
  // por algo positivo (puntos hacia su próximo cupón) que motiva a pedir
  // más sin recordarle cuánto dinero ha gastado.
  const [devoPoints, setDevoPoints] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState(0);

  const loadDevoData = useCallback(async () => {
    try {
      const { devoCouponsApi } = await import('../../services/api');
      const data = await devoCouponsApi.getMy();
      setDevoPoints(data.points || 0);
      setAvailableCoupons(
        (data.coupons || []).filter(
          (c: any) => c.status === 'active' || c.status === 'pending_admin',
        ).length,
      );
    } catch (error) {
      // Silent — si falla mantiene los defaults.
    }
  }, []);

  useEffect(() => {
    loadDevoData();
  }, [loadDevoData]);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          clearCart();
          logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es irreversible. Todos tus datos serán eliminados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Cuenta eliminada', 'Tu cuenta ha sido eliminada.');
            logout();
          },
        },
      ],
    );
  };

  // ============ HANDLERS DE SOPORTE / RUTAS PENDIENTES ============
  const SUPPORT_PHONE = '525555555555'; // TODO: # oficial
  const openSupport = (preset?: string) => {
    const userName = user?.name || 'un cliente';
    const msg = preset
      ? `Hola, soy ${userName}. ${preset}`
      : `Hola, soy ${userName} y necesito ayuda.`;
    const url = `whatsapp://send?phone=${SUPPORT_PHONE}&text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url).then((can) => {
      if (can) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp no disponible',
          'Escríbenos a soporte@devolon.mx',
          [{ text: 'OK' }],
        );
      }
    });
  };

  // "Mis direcciones" — CRUD completo de direcciones del cliente con
  // autocompletado GPS + edición manual.
  const handleAddresses = () => {
    navigation.navigate('Addresses');
  };

  // "Métodos de pago" — Stripe/OXXO se elige en checkout. Una vez que
  // se conecten tarjetas guardadas se podrá listar/gestionar aquí.
  const handlePaymentMethods = () => {
    Alert.alert(
      'Métodos de pago',
      'Al hacer un pedido eliges entre tarjeta, efectivo u OXXO. La gestión de tarjetas guardadas llegará pronto.',
      [{ text: 'Entendido' }],
    );
  };

  // "Centro de ayuda" — opciones de contacto.
  const handleHelp = () => {
    Alert.alert('Centro de ayuda', '¿Cómo te podemos ayudar?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Chat con soporte', onPress: () => openSupport() },
      {
        text: 'Llamar',
        onPress: () => Linking.openURL(`tel:+${SUPPORT_PHONE}`),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: s['4xl'] }}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>CUENTA</Text>
          <Text style={styles.headerTitle}>Mi perfil</Text>
        </View>

        {/* PROFILE CARD */}
        <View style={{ paddingHorizontal: s.xl }}>
          <Card
            variant="glass"
            onPress={() => navigation.navigate('EditProfile')}
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.profileCard}
          >
            <View style={styles.avatarWrap}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0).toUpperCase() || 'D'}
                  </Text>
                </View>
              )}
              <View style={styles.cameraDot}>
                <Ionicons name="camera" size={12} color={colors.onPrimary} />
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {user?.name || 'Usuario'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>{user?.email}</Text>
              <View style={styles.verifiedRow}>
                <Ionicons
                  name={user?.emailVerified ? 'checkmark-circle' : 'alert-circle'}
                  size={13}
                  color={user?.emailVerified ? colors.success : colors.textMuted}
                />
                <Text
                  style={[
                    styles.verifiedText,
                    { color: user?.emailVerified ? colors.success : colors.textMuted },
                  ]}
                >
                  {user?.emailVerified ? 'Verificado' : 'Sin verificar'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Card>

          {/* STATS — el tercer stat era "GASTADO" (mal psicológicamente:
              recuerda al cliente cuánto $ ha pagado). Lo cambiamos por
              PUNTOS DEVO con click → wallet de cupones. */}
          <Card
            variant="glass"
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.statsCard}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statLabel}>PEDIDOS</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>FAVORITOS</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.navigate('QuiuPoints')}
              style={styles.statItem}
            >
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {devoPoints}
              </Text>
              <Text style={styles.statLabel}>PUNTOS DEVO</Text>
            </TouchableOpacity>
          </Card>

          {/* Banner destacado cuando el cliente tiene cupones disponibles */}
          {availableCoupons > 0 && (
            <Card
              variant="raised"
              padding={s.md}
              borderRadius={radius.xl}
              onPress={() => navigation.navigate('QuiuPoints')}
              style={styles.couponsBanner}
            >
              <View style={styles.couponsBannerIcon}>
                <Ionicons name="gift" size={22} color={colors.onPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.couponsBannerTitle}>
                  {availableCoupons === 1
                    ? 'Tienes 1 cupón para usar'
                    : `Tienes ${availableCoupons} cupones para usar`}
                </Text>
                <Text style={styles.couponsBannerSub}>
                  Aplícalos en tu próximo pedido
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Card>
          )}

          {/* MENU GROUPS */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>CUENTA</Text>
            <Card variant="glass" padding={0} borderRadius={radius.xl}>
              <MenuItem
                icon="location-outline"
                title="Mis direcciones"
                subtitle="Administra tus direcciones"
                onPress={handleAddresses}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="card-outline"
                title="Métodos de pago"
                subtitle="Tarjetas y otros métodos"
                onPress={handlePaymentMethods}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="receipt-outline"
                title="Historial de pedidos"
                subtitle="Ver todos tus pedidos"
                onPress={() => navigation.navigate('OrderHistory')}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="heart-outline"
                title="Favoritos"
                subtitle="Restaurantes guardados"
                onPress={() => navigation.navigate('Favorites')}
              />
            </Card>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>PREFERENCIAS</Text>
            <Card variant="glass" padding={0} borderRadius={radius.xl}>
              <MenuItem
                icon="notifications-outline"
                title="Notificaciones"
                subtitle={notificationsEnabled ? 'Activadas' : 'Desactivadas'}
                onPress={() => setNotificationsEnabled((p) => !p)}
                showArrow={false}
                rightComponent={
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.text}
                  />
                }
              />
              <View style={styles.divider} />
              <MenuItem
                icon="navigate-outline"
                title="Ubicación"
                subtitle={locationEnabled ? 'Permitida' : 'Denegada'}
                onPress={() => setLocationEnabled((p) => !p)}
                showArrow={false}
                rightComponent={
                  <Switch
                    value={locationEnabled}
                    onValueChange={setLocationEnabled}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.text}
                  />
                }
              />
              <View style={styles.divider} />
              <MenuItem icon="language-outline" title="Idioma" subtitle="Español" onPress={() => Alert.alert('Idioma', 'Solo disponible en Español por ahora.')} />
            </Card>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>SOPORTE</Text>
            <Card variant="glass" padding={0} borderRadius={radius.xl}>
              <MenuItem
                icon="help-circle-outline"
                title="Centro de ayuda"
                subtitle="WhatsApp o llamada con soporte"
                onPress={handleHelp}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="chatbubble-outline"
                title="Chat de soporte"
                onPress={() => navigation.navigate('LiveChat')}
              />
              <View style={styles.divider} />
              <MenuItem icon="document-text-outline" title="Términos y condiciones" onPress={() => navigation.navigate('Terms')} />
              <View style={styles.divider} />
              <MenuItem icon="shield-checkmark-outline" title="Política de privacidad" onPress={() => navigation.navigate('Privacy')} />
            </Card>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>SESIÓN</Text>
            <Card variant="glass" padding={0} borderRadius={radius.xl}>
              <MenuItem icon="log-out-outline" title="Cerrar sesión" onPress={handleLogout} danger showArrow={false} />
              <View style={styles.divider} />
              <MenuItem icon="trash-outline" title="Eliminar cuenta" onPress={handleDeleteAccount} danger showArrow={false} />
            </Card>
          </View>

          <View style={styles.versionWrap}>
            <Text style={styles.versionText}>DEVOLÓN · v1.0.0</Text>
            <Text style={styles.versionSubtext}>Hecho en México</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  header: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },

  // ============ PROFILE CARD ============
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
  },
  cameraDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1 },
  profileName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  verifiedText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ STATS ============
  statsCard: {
    flexDirection: 'row',
    marginTop: s.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },

  // ============ BANNER DE CUPONES DEVO ============
  couponsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginTop: s.md,
  },
  couponsBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponsBannerTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  couponsBannerSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // ============ GROUPS ============
  group: { marginTop: s.xl },
  groupTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
    paddingLeft: s.xs,
  },

  // ============ MENU ITEM ============
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.md,
    paddingHorizontal: s.md,
    gap: s.sm,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderColor: 'rgba(229,72,77,0.32)',
  },
  menuBody: { flex: 1 },
  menuTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  menuTitleDanger: { color: colors.danger },
  menuSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: s.md,
  },

  // ============ FOOTER ============
  versionWrap: {
    alignItems: 'center',
    paddingVertical: s['2xl'],
  },
  versionText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  versionSubtext: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
});
