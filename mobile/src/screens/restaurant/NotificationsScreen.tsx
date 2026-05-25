// ==========================================
// DEVOLÓN — Restaurant Notifications
//
// Preferencias de notificaciones del dueño. Persistencia local con
// AsyncStorage. Cuando se integre con expo-notifications + backend
// se conectará al endpoint /me/notifications/preferences.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen, Header, Card, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type PrefKey =
  | 'newOrder'
  | 'orderCancelled'
  | 'editorMessage'
  | 'adminAnnouncement'
  | 'reviewReceived'
  | 'payoutReady'
  | 'promotions';

interface Pref {
  key: PrefKey;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  defaultEnabled: boolean;
  group: 'operación' | 'finanzas' | 'marketing';
}

const PREFS: Pref[] = [
  {
    key: 'newOrder',
    icon: 'receipt-outline',
    label: 'Nuevo pedido',
    description: 'Te avisamos al instante cuando llega un pedido.',
    defaultEnabled: true,
    group: 'operación',
  },
  {
    key: 'orderCancelled',
    icon: 'close-circle-outline',
    label: 'Pedido cancelado',
    description: 'Alerta si un pedido se cancela después de aceptarlo.',
    defaultEnabled: true,
    group: 'operación',
  },
  {
    key: 'editorMessage',
    icon: 'chatbubble-outline',
    label: 'Mensaje del editor',
    description: 'Cuando tu editor te escribe sobre cambios al menú.',
    defaultEnabled: true,
    group: 'operación',
  },
  {
    key: 'reviewReceived',
    icon: 'star-outline',
    label: 'Nueva reseña',
    description: 'Cuando un cliente califica un pedido entregado.',
    defaultEnabled: true,
    group: 'operación',
  },
  {
    key: 'payoutReady',
    icon: 'cash-outline',
    label: 'Pago listo',
    description: 'Cuando Devolón te transfiere tus ventas de la semana.',
    defaultEnabled: true,
    group: 'finanzas',
  },
  {
    key: 'adminAnnouncement',
    icon: 'megaphone-outline',
    label: 'Anuncios de Devolón',
    description: 'Cambios importantes en la plataforma.',
    defaultEnabled: true,
    group: 'marketing',
  },
  {
    key: 'promotions',
    icon: 'gift-outline',
    label: 'Promociones y consejos',
    description: 'Tips para vender más y campañas de marketing.',
    defaultEnabled: false,
    group: 'marketing',
  },
];

const STORAGE_KEY = '@devolon:restaurant:notifications';

export default function RestaurantNotificationsScreen() {
  const [enabled, setEnabled] = useState<Record<PrefKey, boolean>>(() =>
    PREFS.reduce((acc, p) => {
      acc[p.key] = p.defaultEnabled;
      return acc;
    }, {} as Record<PrefKey, boolean>),
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setEnabled((prev) => ({ ...prev, ...JSON.parse(raw) }));
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key: PrefKey) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
      Alert.alert('Listo', 'Tus preferencias fueron guardadas.');
    } finally {
      setSaving(false);
    }
  };

  // Agrupar prefs por categoría para mostrar headers
  const groups = ['operación', 'finanzas', 'marketing'] as const;
  const titleByGroup: Record<(typeof groups)[number], string> = {
    operación: 'OPERACIÓN',
    finanzas: 'FINANZAS',
    marketing: 'MARKETING',
  };

  return (
    <Screen padded={false}>
      <Header title="Notificaciones" eyebrow="NEGOCIO" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Elige qué alertas quieres recibir. Las de operación son críticas para
          no perder pedidos.
        </Text>

        {groups.map((g) => {
          const items = PREFS.filter((p) => p.group === g);
          return (
            <View key={g} style={styles.group}>
              <Text style={styles.groupTitle}>{titleByGroup[g]}</Text>
              <Card variant="glass" padding={0} borderRadius={radius.lg}>
                {items.map((p, idx) => (
                  <React.Fragment key={p.key}>
                    {idx > 0 && <View style={styles.divider} />}
                    <View style={styles.row}>
                      <View
                        style={[
                          styles.prefIcon,
                          enabled[p.key] && styles.prefIconActive,
                        ]}
                      >
                        <Ionicons
                          name={p.icon}
                          size={16}
                          color={
                            enabled[p.key] ? colors.primary : colors.textMuted
                          }
                        />
                      </View>
                      <View style={styles.prefBody}>
                        <Text style={styles.prefLabel}>{p.label}</Text>
                        <Text style={styles.prefDescription}>{p.description}</Text>
                      </View>
                      <Switch
                        value={enabled[p.key]}
                        onValueChange={() => toggle(p.key)}
                        trackColor={{
                          false: colors.border,
                          true: colors.primary,
                        }}
                        thumbColor={colors.text}
                      />
                    </View>
                  </React.Fragment>
                ))}
              </Card>
            </View>
          );
        })}

        <View style={styles.actionWrap}>
          <Button
            label="GUARDAR PREFERENCIAS"
            icon="checkmark"
            iconPosition="right"
            loading={saving}
            onPress={handleSave}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
    paddingTop: s.sm,
  },
  intro: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
    marginBottom: s.lg,
  },

  group: { marginBottom: s.lg },
  groupTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
    paddingLeft: s.xs,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s.md,
    paddingHorizontal: s.md,
    gap: s.sm,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefIconActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.32)',
  },
  prefBody: { flex: 1 },
  prefLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  prefDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: s.md,
  },

  actionWrap: { marginTop: s.lg },
});
