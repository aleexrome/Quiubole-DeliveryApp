// ==========================================
// DEVOLÓN — Restaurant Payments
//
// El dueño activa/desactiva qué métodos de pago acepta su negocio.
// Persistencia local con AsyncStorage por ahora — cuando se integre
// Stripe Connect se conectará al backend real.
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

type MethodKey = 'card' | 'cash' | 'transfer' | 'oxxo';

interface Method {
  key: MethodKey;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
  defaultEnabled: boolean;
  badge?: string;
}

const METHODS: Method[] = [
  {
    key: 'card',
    icon: 'card-outline',
    label: 'Tarjeta de crédito/débito',
    description: 'Cobro automático al confirmar el pedido.',
    defaultEnabled: true,
    badge: 'RECOMENDADO',
  },
  {
    key: 'cash',
    icon: 'cash-outline',
    label: 'Efectivo en entrega',
    description: 'El cliente paga al repartidor al recibir.',
    defaultEnabled: true,
  },
  {
    key: 'transfer',
    icon: 'swap-horizontal-outline',
    label: 'Transferencia SPEI',
    description: 'Confirmas el pago manualmente antes de preparar.',
    defaultEnabled: false,
  },
  {
    key: 'oxxo',
    icon: 'storefront-outline',
    label: 'Pago en OXXO',
    description: 'El cliente paga con código de barras.',
    defaultEnabled: false,
  },
];

const STORAGE_KEY = '@devolon:restaurant:payment-methods';

export default function RestaurantPaymentsScreen() {
  const [enabled, setEnabled] = useState<Record<MethodKey, boolean>>(() =>
    METHODS.reduce((acc, m) => {
      acc[m.key] = m.defaultEnabled;
      return acc;
    }, {} as Record<MethodKey, boolean>),
  );
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setEnabled(JSON.parse(raw));
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key: MethodKey) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
      Alert.alert('Listo', 'Tus métodos de pago fueron actualizados.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Métodos de pago" eyebrow="NEGOCIO" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card
          variant="glass"
          padding={s.md}
          borderRadius={radius.lg}
          style={styles.intro}
        >
          <View style={styles.introIcon}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <Text style={styles.introText}>
            Elige qué métodos de pago aceptas. Los clientes solo podrán pagar
            con los métodos que actives.
          </Text>
        </Card>

        <View style={styles.list}>
          {METHODS.map((m) => (
            <Card
              key={m.key}
              variant="glass"
              padding={s.md}
              borderRadius={radius.lg}
              style={styles.methodCard}
            >
              <View style={styles.methodHeader}>
                <View
                  style={[
                    styles.methodIcon,
                    enabled[m.key] && styles.methodIconActive,
                  ]}
                >
                  <Ionicons
                    name={m.icon}
                    size={20}
                    color={enabled[m.key] ? colors.primary : colors.textMuted}
                  />
                </View>
                <View style={styles.methodBody}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodLabel}>{m.label}</Text>
                    {m.badge && (
                      <View style={styles.methodBadge}>
                        <Text style={styles.methodBadgeText}>{m.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.methodDescription}>{m.description}</Text>
                </View>
                <Switch
                  value={enabled[m.key]}
                  onValueChange={() => toggle(m.key)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.text}
                />
              </View>
            </Card>
          ))}
        </View>

        <View style={styles.actionWrap}>
          <Button
            label="GUARDAR CAMBIOS"
            icon="checkmark"
            iconPosition="right"
            loading={saving}
            onPress={handleSave}
          />
        </View>

        <Text style={styles.hint}>
          Para activar pagos con tarjeta deberás conectar tu cuenta bancaria —
          próximamente con Stripe.
        </Text>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
    marginBottom: s.lg,
  },
  introIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },

  list: { gap: s.xs },
  methodCard: {},
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodIconActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.32)',
  },
  methodBody: { flex: 1 },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    flexWrap: 'wrap',
  },
  methodLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
  },
  methodBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.black,
    letterSpacing: 0.4,
  },
  methodDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    marginTop: 2,
  },

  actionWrap: { marginTop: s.lg },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.md,
    paddingHorizontal: s.md,
    lineHeight: 16,
  },
});
