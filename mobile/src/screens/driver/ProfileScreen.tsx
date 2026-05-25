// ==========================================
// DEVOLÓN — Perfil del rider
//
// Profile card glass con avatar + rating chip + verificado, stats grid
// (rating, entregas), vehículo card, documentos 2x2, preferencias con
// switches amarillos, menú soporte y logout danger.
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
import { Driver } from '../../types';
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

export default function DriverProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const driver = user as Driver;

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  // Abre WhatsApp del soporte con mensaje prellenado.
  const SUPPORT_PHONE = '525555555555'; // TODO: cambiar al # oficial
  const openSupport = (preset?: string) => {
    const msg = preset
      ? `Hola, soy ${driver?.name || 'un rider'}. ${preset}`
      : `Hola, soy ${driver?.name || 'un rider'} y necesito ayuda.`;
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

  // Documento: muestra estado + opcion de contactar soporte para actualizarlo.
  const handleDocumentPress = (docLabel: string, uploaded: boolean) => {
    if (uploaded) {
      Alert.alert(
        `${docLabel}`,
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

  // Cuenta bancaria registrada para recibir pagos semanales.
  const handlePaymentMethod = () => {
    const hasBank = !!(driver as any)?.bankAccount;
    if (hasBank) {
      const bank = (driver as any).bankAccount;
      Alert.alert(
        'Cuenta para depósitos',
        `Banco: ${bank.bankName || '—'}\nCLABE: ${bank.clabe ? '****' + String(bank.clabe).slice(-4) : '—'}\n\nLos pagos se depositan cada lunes.`,
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
        'Para recibir tus pagos semanales necesitamos tus datos bancarios. Contacta a soporte para registrarlos de forma segura.',
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

  const handleBenefits = () => {
    Alert.alert(
      'Seguro y beneficios',
      '• Seguro de accidentes durante entregas activas\n• Cobertura médica básica con +50 entregas/sem\n• Descuentos en mantenimiento de tu vehículo\n• Bonos por completar metas semanales\n\nLos beneficios aplican para riders verificados con +30 entregas.',
      [{ text: 'Entendido' }],
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Centro de ayuda',
      '¿Cómo te podemos ayudar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Chat con soporte',
          onPress: () => openSupport(),
        },
        {
          text: 'Llamar',
          onPress: () => Linking.openURL(`tel:+${SUPPORT_PHONE}`),
        },
      ],
    );
  };

  const handleTerms = () => {
    navigation.navigate('Terms');
  };

  // Card del rider — abre form para editar foto/nombre/teléfono/etc.
  const handleEditProfile = () => {
    navigation.navigate('DriverProfileEdit');
  };

  // Stat ENTREGAS — lleva al tab Deliveries (historial completo).
  const handleViewDeliveries = () => {
    navigation.navigate('Deliveries' as any);
  };

  // Stat RATING — muestra desglose con ultimas calificaciones.
  const handleViewRating = () => {
    const rating = Number(driver?.rating) || 0;
    const total = driver?.totalDeliveries || 0;
    Alert.alert(
      'Tu calificación',
      `Promedio: ${rating.toFixed(1)} ★\nBasado en ${total} entrega${total === 1 ? '' : 's'}\n\nLas calificaciones más altas te dan prioridad en pedidos y acceso a bonos. Mantén buen trato, puntualidad y cuidado con la comida.`,
      [{ text: 'Entendido' }],
    );
  };

  const vehicleIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    bicycle: 'bicycle',
    motorcycle: 'speedometer',
    car: 'car',
  };

  const vehicleNames: Record<string, string> = {
    bicycle: 'Bicicleta',
    motorcycle: 'Motocicleta',
    car: 'Automóvil',
  };

  const docs: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'idCard', label: 'INE', icon: 'card-outline' },
    { key: 'driverLicense', label: 'Licencia', icon: 'document-outline' },
    { key: 'vehicleCard', label: 'T. Circulación', icon: 'car-outline' },
    { key: 'proofOfAddress', label: 'Domicilio', icon: 'home-outline' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>RIDER · CUENTA</Text>
          <Text style={styles.headerTitle}>Mi perfil</Text>
        </View>

        <View style={styles.body}>
          {/* PROFILE CARD — tap = editar foto/nombre/datos */}
          <Card
            variant="glass"
            padding={s.lg}
            borderRadius={radius.xl}
            onPress={handleEditProfile}
            style={styles.profileCard}
          >
            <View style={styles.avatarWrap}>
              {driver?.avatar ? (
                <Image source={{ uri: driver.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {driver?.name?.charAt(0).toUpperCase() || 'D'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarRing} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName} numberOfLines={1}>
                {driver?.name || 'Rider'}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {driver?.email}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  driver?.isApproved ? styles.statusBadgeOk : styles.statusBadgePending,
                ]}
              >
                <Ionicons
                  name={driver?.isApproved ? 'checkmark-circle' : 'time'}
                  size={12}
                  color={driver?.isApproved ? colors.success : colors.primary}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: driver?.isApproved ? colors.success : colors.primary,
                    },
                  ]}
                >
                  {driver?.isApproved ? 'Verificado' : 'En revisión'}
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.textMuted}
            />
          </Card>

          {/* STATS — cada card es clickeable */}
          <View style={styles.statsRow}>
            <Card
              variant="raised"
              padding={s.md}
              borderRadius={radius.xl}
              onPress={handleViewRating}
              style={styles.statCard}
            >
              <Ionicons name="star" size={18} color={colors.primary} />
              <Text style={styles.statValue}>
                {(Number(driver?.rating) || 0).toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>RATING</Text>
            </Card>
            <Card
              variant="glass"
              padding={s.md}
              borderRadius={radius.xl}
              onPress={handleViewDeliveries}
              style={styles.statCard}
            >
              <Ionicons name="bicycle" size={18} color={colors.primary} />
              <Text style={styles.statValue}>
                {driver?.totalDeliveries || 0}
              </Text>
              <Text style={styles.statLabel}>ENTREGAS</Text>
            </Card>
          </View>

          {/* VEHICLE */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>MI VEHÍCULO</Text>
            <Card
              variant="glass"
              padding={s.lg}
              borderRadius={radius.xl}
              onPress={() => navigation.navigate('DriverVehicle')}
              style={styles.vehicleCard}
            >
              <View style={styles.vehicleIcon}>
                <Ionicons
                  name={vehicleIcons[driver?.vehicleType || 'bicycle']}
                  size={26}
                  color={colors.primary}
                />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleType}>
                  {vehicleNames[driver?.vehicleType || 'bicycle']}
                </Text>
                {driver?.vehiclePlate ? (
                  <Text style={styles.vehiclePlate}>{driver.vehiclePlate}</Text>
                ) : (
                  <Text style={styles.vehiclePlate}>Toca para configurar</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          </View>

          {/* DOCUMENTS */}
          <View style={styles.group}>
            <Text style={styles.groupTitle}>DOCUMENTOS</Text>
            <View style={styles.docsGrid}>
              {docs.map((doc) => {
                const uploaded =
                  !!driver?.documents?.[doc.key as keyof typeof driver.documents];
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
                        <Ionicons name={doc.icon} size={18} color={colors.primary} />
                      </View>
                      <Text style={styles.docLabel} numberOfLines={1}>
                        {doc.label}
                      </Text>
                      <View
                        style={[
                          styles.docStatus,
                          uploaded ? styles.docStatusOk : styles.docStatusPending,
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
                            { color: uploaded ? colors.success : colors.textMuted },
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
                title="Sonido de pedidos"
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
                title="Métodos de pago"
                subtitle={
                  (driver as any)?.bankAccount
                    ? 'Cuenta registrada'
                    : 'Sin cuenta — registra una'
                }
                onPress={handlePaymentMethod}
              />
              <View style={styles.divider} />
              <MenuItem
                icon="shield-checkmark-outline"
                title="Seguro y beneficios"
                subtitle="Cobertura durante entregas"
                onPress={handleBenefits}
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

          <View style={styles.versionWrap}>
            <Text style={styles.versionText}>DEVOLÓN RIDER · v1.0.0</Text>
            <Text style={styles.versionSubtext}>Hecho en México</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ HEADER ============
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
  body: { paddingHorizontal: s.xl },

  // ============ PROFILE CARD ============
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

  // ============ STATS ============
  statsRow: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
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

  // ============ VEHICLE ============
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: { flex: 1 },
  vehicleType: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  vehiclePlate: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },

  // ============ DOCS ============
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  docCardWrap: {
    width: '48.5%',
  },
  docCard: {
    alignItems: 'flex-start',
    gap: s.xs,
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
  },
  docStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
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
