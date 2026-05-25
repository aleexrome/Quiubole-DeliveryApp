// ==========================================
// DEVOLÓN — Admin Settings
//
// Pantalla de configuración del panel admin. Cada item tiene handler:
//   - Si existe screen real → navega ahí
//   - Si es feature pendiente → Alert con descripción de qué hará
//   - Soporte → WhatsApp / llamada
//
// Todos los botones son clickeables (no más placeholders sin onPress).
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Card, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface AdminMenuItem {
  icon: IconName;
  label: string;
  /** Si es 'comingSoon' muestra Alert. Si es 'navigate', va a `screen`.
   *  Si es 'custom', llama a `onPress` directo. */
  action: 'navigate' | 'comingSoon' | 'custom';
  screen?: string;
  description?: string;
  onPress?: () => void;
}

const SYSTEM_STATUS = [
  { label: 'API', value: 'Online', dot: colors.success },
  { label: 'BASE DE DATOS', value: 'Online', dot: colors.success },
  { label: 'PAGOS', value: 'Activo', dot: colors.success },
  { label: 'PUSH', value: 'Activo', dot: colors.success },
];

const SUPPORT_PHONE = '525555555555'; // TODO: # oficial

export default function AdminSettingsScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  const comingSoon = (label: string, description: string) => {
    Alert.alert(label, description, [{ text: 'Entendido' }]);
  };

  const openWhatsApp = (preset: string) => {
    const msg = `Hola, soy admin de Devolón. ${preset}`;
    const url = `whatsapp://send?phone=${SUPPORT_PHONE}&text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url).then((can) => {
      if (can) {
        Linking.openURL(url);
      } else {
        Alert.alert(
          'WhatsApp no disponible',
          'Escribe a soporte@devolon.mx',
          [{ text: 'OK' }],
        );
      }
    });
  };

  // ============================================
  // MAPEO DE ITEMS A HANDLERS
  // ============================================
  const SECTIONS: { title: string; items: AdminMenuItem[] }[] = [
    {
      title: 'GENERAL',
      items: [
        {
          icon: 'business-outline',
          label: 'Información del negocio',
          action: 'comingSoon',
          description:
            'Próximamente: editar nombre comercial, RFC, dirección fiscal y datos legales de Devolón.',
        },
        {
          icon: 'location-outline',
          label: 'Zonas de cobertura',
          action: 'comingSoon',
          description:
            'Por ahora opera solo en Tenancingo (seed automático). Próximamente: agregar/editar zonas, ajustar radio y delivery fees por municipio desde aquí.',
        },
        {
          icon: 'time-outline',
          label: 'Horarios de operación',
          action: 'comingSoon',
          description:
            'Próximamente: definir horarios globales en que Devolón acepta pedidos (ej. cerrar a partir de medianoche).',
        },
      ],
    },
    {
      title: 'FINANZAS',
      items: [
        {
          icon: 'cash-outline',
          label: 'Comisiones',
          action: 'navigate',
          screen: 'AdminFinance',
        },
        {
          icon: 'card-outline',
          label: 'Métodos de pago',
          action: 'comingSoon',
          description:
            'Próximamente: activar/desactivar tarjeta, efectivo y OXXO globalmente. Hoy se aceptan los tres por default.',
        },
        {
          icon: 'wallet-outline',
          label: 'Pagos a repartidores',
          action: 'navigate',
          screen: 'AdminFinance',
        },
      ],
    },
    {
      title: 'PROMOCIONES',
      items: [
        {
          icon: 'gift-outline',
          label: 'Cupones Devo',
          action: 'navigate',
          screen: 'AdminDevoCoupons',
        },
        {
          icon: 'pricetag-outline',
          label: 'Códigos promocionales',
          action: 'comingSoon',
          description:
            'Próximamente: crear códigos globales tipo BIENVENIDO20 que cualquier cliente pueda canjear.',
        },
        {
          icon: 'people-outline',
          label: 'Programa de referidos',
          action: 'comingSoon',
          description:
            'Próximamente: cada cliente recibirá un código único; cuando un referido haga su primer pedido, ambos ganan créditos.',
        },
      ],
    },
    {
      title: 'NOTIFICACIONES',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notificaciones',
          action: 'comingSoon',
          description:
            'Próximamente: enviar notificaciones masivas a clientes, repartidores o restaurantes segmentados por zona o actividad.',
        },
        {
          icon: 'mail-outline',
          label: 'Email templates',
          action: 'comingSoon',
          description:
            'Próximamente: editar las plantillas de correo (verificación, confirmación de pedido, payouts, etc.).',
        },
        {
          icon: 'chatbubbles-outline',
          label: 'SMS / WhatsApp',
          action: 'comingSoon',
          description:
            'Próximamente: integración con Twilio/WhatsApp Business para mensajes transaccionales.',
        },
      ],
    },
    {
      title: 'SISTEMA',
      items: [
        {
          icon: 'shield-checkmark-outline',
          label: 'Seguridad',
          action: 'comingSoon',
          description:
            'Próximamente: gestión de sesiones activas, 2FA para admins, logs de auditoría y bloqueo de IPs sospechosas.',
        },
        {
          icon: 'analytics-outline',
          label: 'Reportes automáticos',
          action: 'comingSoon',
          description:
            'Próximamente: programar reportes diarios/semanales por email (ventas, comisiones, top restaurantes, etc.).',
        },
        {
          icon: 'cloud-upload-outline',
          label: 'Backups',
          action: 'comingSoon',
          description:
            'Próximamente: respaldo automático de la base de datos en S3/GCS con retención configurable.',
        },
      ],
    },
  ];

  const handleItem = (item: AdminMenuItem) => {
    if (item.action === 'navigate' && item.screen) {
      navigation.navigate(item.screen);
    } else if (item.action === 'comingSoon') {
      comingSoon(item.label, item.description || 'Próximamente disponible.');
    } else if (item.action === 'custom' && item.onPress) {
      item.onPress();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: s['4xl'] }}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ADMINISTRACIÓN</Text>
          <Text style={styles.title}>Configuración</Text>
        </View>

        <View style={{ paddingHorizontal: s.xl }}>
          {/* ADMIN CARD */}
          <Card
            variant="glass"
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.adminCard}
          >
            <View style={styles.adminAvatar}>
              <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            </View>
            <View style={styles.adminInfo}>
              <Text style={styles.adminName}>{user?.name || 'Admin'}</Text>
              <Text style={styles.adminRole}>ADMINISTRADOR</Text>
            </View>
            <View style={styles.adminBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            </View>
          </Card>

          {/* SECTIONS */}
          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Card variant="glass" padding={0} borderRadius={radius.xl}>
                {section.items.map((item, idx) => (
                  <React.Fragment key={item.label}>
                    <TouchableOpacity
                      style={styles.menuItem}
                      activeOpacity={0.85}
                      onPress={() => handleItem(item)}
                    >
                      <View style={styles.menuIcon}>
                        <Ionicons name={item.icon} size={18} color={colors.primary} />
                      </View>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.action === 'comingSoon' && (
                        <View style={styles.soonBadge}>
                          <Text style={styles.soonBadgeText}>PRÓXIMAMENTE</Text>
                        </View>
                      )}
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                    {idx < section.items.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </React.Fragment>
                ))}
              </Card>
            </View>
          ))}

          {/* SYSTEM STATUS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ESTADO DEL SISTEMA</Text>
            <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
              <View style={styles.statusGrid}>
                {SYSTEM_STATUS.map((s_) => (
                  <View key={s_.label} style={styles.statusCard}>
                    <View style={[styles.statusDot, { backgroundColor: s_.dot }]} />
                    <Text style={styles.statusLabel}>{s_.label}</Text>
                    <Text style={styles.statusValue}>{s_.value}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          {/* SUPPORT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SOPORTE</Text>
            <Card variant="glass" padding={0} borderRadius={radius.xl}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert(
                    'Centro de ayuda',
                    'Documentación y guías para el panel admin.',
                    [
                      { text: 'Cerrar', style: 'cancel' },
                      {
                        text: 'Contactar soporte',
                        onPress: () =>
                          openWhatsApp(
                            'Tengo una duda sobre el panel admin.',
                          ),
                      },
                    ],
                  )
                }
              >
                <View style={[styles.menuIcon, styles.menuIconInfo]}>
                  <Ionicons
                    name="help-circle-outline"
                    size={18}
                    color={colors.info}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>Centro de ayuda</Text>
                  <Text style={styles.menuSubLabel}>Documentación y guías</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert('Soporte técnico', '¿Cómo te contactamos?', [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'WhatsApp',
                      onPress: () =>
                        openWhatsApp('Necesito soporte técnico urgente.'),
                    },
                    {
                      text: 'Llamar',
                      onPress: () =>
                        Linking.openURL(`tel:+${SUPPORT_PHONE}`),
                    },
                  ])
                }
              >
                <View style={[styles.menuIcon, styles.menuIconSuccess]}>
                  <Ionicons
                    name="chatbubbles-outline"
                    size={18}
                    color={colors.success}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.menuLabel}>Soporte técnico</Text>
                  <Text style={styles.menuSubLabel}>Contactar equipo</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </Card>
          </View>

          {/* LOGOUT */}
          <View style={{ marginTop: s.xl }}>
            <Button
              label="CERRAR SESIÓN"
              variant="danger"
              icon="log-out-outline"
              iconPosition="left"
              onPress={handleLogout}
            />
          </View>

          <Text style={styles.version}>DEVOLÓN ADMIN · v1.0.0</Text>
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
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 2,
  },

  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  adminAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminInfo: { flex: 1 },
  adminName: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
  },
  adminRole: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginTop: 2,
  },
  adminBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(31,174,111,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginTop: s.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
    paddingLeft: s.xs,
  },

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
  menuIconInfo: {
    backgroundColor: 'rgba(46,144,250,0.12)',
    borderColor: 'rgba(46,144,250,0.3)',
  },
  menuIconSuccess: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderColor: 'rgba(31,174,111,0.3)',
  },
  menuLabel: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  menuSubLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },
  // Chip "PRÓXIMAMENTE" — discreto, marca claramente lo que aún no jala.
  soonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  soonBadgeText: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: s.md,
  },

  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    padding: s.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginBottom: 6,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  statusValue: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    marginTop: 2,
  },

  version: {
    textAlign: 'center',
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginTop: s['2xl'],
  },
});
