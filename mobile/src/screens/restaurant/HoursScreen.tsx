// ==========================================
// DEVOLÓN — Restaurant Hours
//
// Editor de horarios 7 días. El dueño puede cerrar/abrir cualquier día
// y ajustar la franja horaria. Persiste en restaurant.openingHours
// (jsonb) vía PATCH /restaurants/:id.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { restaurantsApi } from '../../services/api';
import { Screen, Header, Card, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

interface DayHours {
  isOpen: boolean;
  openTime: string; // "09:00"
  closeTime: string; // "22:00"
}

type Hours = Record<DayKey, DayHours>;

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: 'monday', label: 'Lunes', short: 'L' },
  { key: 'tuesday', label: 'Martes', short: 'M' },
  { key: 'wednesday', label: 'Miércoles', short: 'M' },
  { key: 'thursday', label: 'Jueves', short: 'J' },
  { key: 'friday', label: 'Viernes', short: 'V' },
  { key: 'saturday', label: 'Sábado', short: 'S' },
  { key: 'sunday', label: 'Domingo', short: 'D' },
];

const DEFAULT_HOURS: Hours = DAYS.reduce((acc, d) => {
  acc[d.key] = { isOpen: true, openTime: '09:00', closeTime: '22:00' };
  return acc;
}, {} as Hours);

export default function RestaurantHoursScreen() {
  const [hours, setHours] = useState<Hours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await restaurantsApi.getMyRestaurant();
      // openingHours puede venir como jsonb del backend o como null
      const oh = r?.openingHours;
      if (oh && typeof oh === 'object') {
        setHours({ ...DEFAULT_HOURS, ...oh });
      }
    } catch (e: any) {
      console.error('Error loading hours:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDay = (key: DayKey) => {
    setHours((prev) => ({
      ...prev,
      [key]: { ...prev[key], isOpen: !prev[key].isOpen },
    }));
  };

  const updateTime = (key: DayKey, field: 'openTime' | 'closeTime') => {
    // En lugar de un time picker nativo (complejo cross-platform), abrimos
    // un Alert.prompt simple. El backend acepta string HH:MM.
    Alert.prompt?.(
      field === 'openTime' ? 'Hora de apertura' : 'Hora de cierre',
      'Formato 24h, ej. 09:00 o 22:30',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'OK',
          onPress: (text) => {
            if (text && /^\d{1,2}:\d{2}$/.test(text)) {
              setHours((prev) => ({
                ...prev,
                [key]: { ...prev[key], [field]: text },
              }));
            }
          },
        },
      ],
      'plain-text',
      hours[key][field],
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await restaurantsApi.updateMyRestaurant({ openingHours: hours } as any);
      Alert.alert('Listo', 'Tus horarios fueron actualizados.');
    } catch (e: any) {
      Alert.alert(
        'No se pudo guardar',
        e?.response?.data?.message || 'Intenta de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <Header title="Horarios" eyebrow="NEGOCIO" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Horarios" eyebrow="NEGOCIO" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.intro}>
          Configura los días y horas en que tu negocio recibe pedidos.
        </Text>

        <View style={styles.daysList}>
          {DAYS.map((d) => {
            const dh = hours[d.key];
            return (
              <Card
                key={d.key}
                variant="glass"
                padding={s.md}
                borderRadius={radius.lg}
                style={styles.dayCard}
              >
                <View style={styles.dayHeader}>
                  <View style={styles.dayLeft}>
                    <View
                      style={[
                        styles.dayBadge,
                        dh.isOpen && styles.dayBadgeOpen,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayBadgeText,
                          dh.isOpen && styles.dayBadgeTextOpen,
                        ]}
                      >
                        {d.short}
                      </Text>
                    </View>
                    <Text style={styles.dayName}>{d.label}</Text>
                  </View>
                  <Switch
                    value={dh.isOpen}
                    onValueChange={() => toggleDay(d.key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor={colors.text}
                  />
                </View>

                {dh.isOpen && (
                  <View style={styles.timeRow}>
                    <TouchableOpacity
                      style={styles.timeChip}
                      onPress={() => updateTime(d.key, 'openTime')}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={colors.primary}
                      />
                      <Text style={styles.timeChipText}>{dh.openTime}</Text>
                    </TouchableOpacity>
                    <Text style={styles.timeSep}>—</Text>
                    <TouchableOpacity
                      style={styles.timeChip}
                      onPress={() => updateTime(d.key, 'closeTime')}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="time-outline"
                        size={13}
                        color={colors.primary}
                      />
                      <Text style={styles.timeChipText}>{dh.closeTime}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        <View style={styles.actionWrap}>
          <Button
            label="GUARDAR HORARIOS"
            icon="checkmark"
            iconPosition="right"
            loading={saving}
            onPress={handleSave}
          />
        </View>

        <Text style={styles.hint}>
          Los cambios se reflejan en la app de tus clientes en cuanto guardas.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  daysList: { gap: s.xs },
  dayCard: {},
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    flex: 1,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeOpen: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.32)',
  },
  dayBadgeText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
  },
  dayBadgeTextOpen: { color: colors.primary },
  dayName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    marginTop: s.sm,
    paddingTop: s.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: s.sm,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeChipText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  timeSep: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  actionWrap: { marginTop: s.xl },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.md,
    paddingHorizontal: s.lg,
  },
});
