// ==========================================
// DEVOLÓN — Editor / Perfil
//
// Profile card glass clickeable (lleva a EditorProfileEdit), stats
// (restaurantes asignados), documentos 2x2 (INE, comprobante de
// domicilio, acta de nacimiento, RFC), preferencias con switches,
// menú de soporte con handlers reales y logout danger.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
  showArrow?: boolean;
  danger?: boolean;
}

const MenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
  rightComponent,
  showArrow = true,
  danger,
}: MenuItemProps) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={!onPress}
  >
    <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
      <Ionicons
        name={icon}
        size={18}
        color={danger ? colors.danger : colors.primary}
      />
    </View>
    <View style={styles.menuBody}>
      <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>
        {title}
      </Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {rightComponent ??
      (showArrow && (
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      ))}
  </TouchableOpacity>
);

const SUPPORT_PHONE = '525555555555'; // TODO: # oficial de soporte

export default function EditorProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const displayName = (user as any)?.firstName
    ? `${(user as any).firstName} ${(user as any).lastName || ''}`.trim()
    : user?.name || 'Editor';
  const initial = displayName?.charAt(0)?.toUpperCase() || 'E';
  const isApproved = (user as any)?.isApproved;

  // ============ HANDLERS ============
  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  const openSupport = (preset?: string) => {
    const msg = preset
      ? `Hola, soy ${displayName} (editor). ${preset}`
      : `Hola, soy ${displayName} (editor) y necesito ayuda.`;
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

  const handleEditProfile = () => {
    navigation.navigate('EditorProfileEdit');
  };

  const handleDocumentPress = (docLabel: string, uploaded: boolean) => {
    if (uploaded) {
      Alert.alert(
        docLabel,
        'Este documento ya fue verificado por nuestro equipo. Si necesitas actualizarlo, contacta a soporte.',
        [
          { text: 'Cerrar', style: 'cancel' },
          {
            text: 'Contactar soporte',
            onPress: () =>
              openSupport(`Necesito actualizar mi documento: ${docLabel}.`),
          },
        ],
      );
    } else {
      Alert.alert(
        `Subir ${docLabel}`,
        `Para subir tu ${docLabel.toLowerCase()}, envía la foto por WhatsApp a soporte. Una vez verificado, aparecerá como "Subido".`,
        [
          { text: 'Cerrar', style: 'cancel' },
          {
            text: 'Enviar por WhatsApp',
            onPress: () =>
              openSupport(`Quiero subir mi ${docLabel.toLowerCase()}.`),
          },
        ],
      );
    }
  };

  const handleAssignedRestaurants = () => {
    // El tab del editor se llama 'Restaurants' dentro del EditorTabs nav.
    navigation.navigate('Restaurants' as any);
  };

  const handlePayoutMethod = () => {
    const hasBank = !!(user as any)?.bankAccount;
    if (hasBank) {
      const bank = (user as any).bankAccount;
      Alert.alert(
        'Cuenta para depósitos',
        `Banco: ${bank.bankName || '—'}\nCLABE: ${
          bank.clabe ? '****' + String(bank.clabe).slice(-4) : '—'
        }\n\nTus comisiones se depositan cada quincena.`,
        [
          { text: 'Cerrar', style: 'cancel' },
          {
            text: 'Cambiar cuenta',
            onPress: () =>
              openSupport(
                'Quiero actualizar mi cuenta bancaria para depósitos.',
              ),
          },
        ],
      );
    } else {
      Alert.alert(
        'Sin cuenta registrada',
        'Para recibir tus comisiones quincenales necesitamos tus datos bancarios. Contacta a soporte para registrarlos.',
        [
          { text: 'Cerrar', style: 'cancel' },
          {
            text: 'Registrar cuenta',
            onPress: () =>
              openSupport('Quiero registrar mi cuenta bancaria.'),
          },
        ],
      );
    }
  };

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

  const handleTerms = () => {
    navigation.navigate('Terms');
  };

  const handlePrivacy = () => {
    navigation.navigate('Privacy');
  };

  // ============ DOCUMENTS ============
  const docs: {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: 'idCard', label: 'INE', icon: 'card-outline' },
    {
      key: 'proofOfAddress',
      label: 'Comprobante de domicilio',
      icon: 'home-outline',
    },
    {
      key: 'birthCertificate',
      label: 'Acta de nacimiento',
      icon: 'document-text-outline',
    },
    { key: 'rfcCertificate', label: 'Constancia RFC', icon: 'business-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>EDITOR · CUENTA</Text>
          <Text style={styles.title}>Mi perfil</Text>
        </View>

        {/* PROFILE CARD — tap = editar */}
        <Card
          variant="glass"
          padding={s.lg}
          borderRadius={radius.xl}
          onPress={handleEditProfile}
          style={styles.profileCard}
        >
          <View style={styles.avatarWrap}>
            {(user as any)?.avatar ? (
              <Image
                source={{ uri: (user as any).avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initial}</Text>
              </View>
            )}
            <View style={styles.avatarRing} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email}
            </Text>
            <View
              style={[
                styles.statusBadge,
                isApproved ? styles.statusBadgeOk : styles.statusBadgePending,
              ]}
            >
              <Ionicons
                name={isApproved ? 'checkmark-circle' : 'time'}
                size={12}
                color={isApproved ? colors.success : colors.primary}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isApproved ? colors.success : colors.primary },
                ]}
              >
                {isApproved ? 'Verificado' : 'En revisión'}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </Card>

        {/* ASSIGNED RESTAURANTS */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>TU TRABAJO</Text>
          <Card
            variant="glass"
            padding={s.lg}
            borderRadius={radius.xl}
            onPress={handleAssignedRestaurants}
            style={styles.workCard}
          >
            <View style={styles.workIcon}>
              <Ionicons name="restaurant" size={22} color={colors.primary} />
            </View>
            <View style={styles.workBody}>
              <Text style={styles.workTitle}>Restaurantes asignados</Text>
              <Text style={styles.workSubtitle}>
                Gestiona menús, precios y fotos
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Card>
        </View>

        {/* DOCUMENTS */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>DOCUMENTOS</Text>
          <View style={styles.docsGrid}>
            {docs.map((doc) => {
              const uploaded = !!(user as any)?.documents?.[doc.key];
              return (
                <TouchableOpacity
                  key={doc.key}
                  activeOpacity={0.85}
                  style={styles.docCardWrap}
                  onPress={() => handleDocumentPress(doc.label, uploaded)}
                >
                  <Card
                    variant="glass"
                    padding={s.md}
                    borderRadius={radius.xl}
                    style={styles.docCard}
                  >
                    <View style={styles.docIconHalo}>
                      <Ionicons
                        name={doc.icon}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.docLabel} numberOfLines={2}>
                      {doc.label}
                    </Text>
                    <View
                      style={[
                        styles.docStatus,
                        uploaded
                          ? styles.docStatusOk
                          : styles.docStatusPending,
                      ]}
                    >
                      <Ionicons
                        name={uploaded ? 'checkmark' : 'cloud-upload-outline'}
                        size={11}
                        color={uploaded ? colors.success : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.docStatusText,
                          {
                            color: uploaded
                              ? colors.success
                              : colors.textMuted,
                          },
                        ]}
                      >
                        {uploaded ? 'Subido' : 'Subir'}
                      </Text>
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>PREFERENCIAS</Text>
          <Card variant="glass" padding={0} borderRadius={radius.xl}>
            <MenuItem
              icon="notifications-outline"
              title="Notificaciones"
              subtitle={notificationsEnabled ? 'Activadas' : 'Desactivadas'}
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
              icon="volume-high-outline"
              title="Sonido de mensajes"
              subtitle={soundEnabled ? 'Activado' : 'Silencio'}
              showArrow={false}
              rightComponent={
                <Switch
                  value={soundEnabled}
                  onValueChange={setSoundEnabled}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.text}
                />
              }
            />
          </Card>
        </View>

        {/* SUPPORT */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>SOPORTE</Text>
          <Card variant="glass" padding={0} borderRadius={radius.xl}>
            <MenuItem
              icon="card-outline"
              title="Cuenta para comisiones"
              subtitle={
                (user as any)?.bankAccount
                  ? 'Cuenta registrada'
                  : 'Sin cuenta — registra una'
              }
              onPress={handlePayoutMethod}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="help-circle-outline"
              title="Centro de ayuda"
              subtitle="Chat o llamada con soporte"
              onPress={handleHelp}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="document-text-outline"
              title="Términos y condiciones"
              onPress={handleTerms}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="shield-checkmark-outline"
              title="Aviso de privacidad"
              onPress={handlePrivacy}
            />
          </Card>
        </View>

        {/* LOGOUT */}
        <View style={styles.group}>
          <Card variant="glass" padding={0} borderRadius={radius.xl}>
            <MenuItem
              icon="log-out-outline"
              title="Cerrar sesión"
              onPress={handleLogout}
              danger
              showArrow={false}
            />
          </Card>
        </View>

        {/* FOOTER */}
        <View style={styles.versionWrap}>
          <Text style={styles.versionText}>DEVOLÓN EDITOR · v1.0.0</Text>
          <Text style={styles.versionSubtext}>Hecho en México</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingHorizontal: s.xl, paddingBottom: s['3xl'] },

  // HEADER
  header: { paddingTop: s.sm, paddingBottom: s.lg },
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

  // PROFILE CARD
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  avatarWrap: {
    position: 'relative',
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: { width: 64, height: 64, borderRadius: radius.pill },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
  },
  avatarRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,194,14,0.35)',
  },
  profileInfo: { flex: 1 },
  profileName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeOk: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(31,174,111,0.32)',
  },
  statusBadgePending: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
  },
  statusBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // GROUPS
  group: { marginTop: s.xl },
  groupTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
    paddingLeft: s.xs,
  },

  // WORK CARD
  workCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  workIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workBody: { flex: 1 },
  workTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  workSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // DOCS
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  docCardWrap: { width: '48.5%' },
  docCard: {
    alignItems: 'flex-start',
    gap: s.xs,
    minHeight: 110,
  },
  docIconHalo: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  docStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 'auto',
  },
  docStatusOk: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(31,174,111,0.32)',
  },
  docStatusPending: {
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docStatusText: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // MENU ITEM
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

  // FOOTER
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
