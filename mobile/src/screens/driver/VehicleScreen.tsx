// ==========================================
// DEVOLÓN — Driver Vehicle
//
// El driver edita la info de su vehículo. Esta info se muestra al
// cliente cuando se asigna driver al pedido (seguridad: placas,
// modelo, color para identificarlo a la entrega).
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { driverApi, authApi } from '../../services/api';
import { Screen, Header, Card, Input, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

type VehicleType = 'bicycle' | 'motorcycle' | 'car';

const TYPES: { key: VehicleType; label: string; icon: keyof typeof Ionicons.glyphMap }[] =
  [
    { key: 'bicycle', label: 'Bicicleta', icon: 'bicycle' },
    { key: 'motorcycle', label: 'Motocicleta', icon: 'speedometer' },
    { key: 'car', label: 'Automóvil', icon: 'car' },
  ];

export default function DriverVehicleScreen() {
  const [vehicleType, setVehicleType] = useState<VehicleType>('bicycle');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const profile: any = await authApi.getProfile();
      if (profile?.vehicleType) setVehicleType(profile.vehicleType);
      setPlate(profile?.vehiclePlate || '');
      setModel(profile?.vehicleModel || '');
      setColor(profile?.vehicleColor || '');
    } catch (e) {
      console.error('Error loading vehicle:', e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await driverApi.updateVehicle({
        vehicleType,
        vehiclePlate: plate.trim().toUpperCase(),
        vehicleModel: model.trim(),
        vehicleColor: color.trim(),
      });
      Alert.alert('Listo', 'Tu vehículo fue actualizado.');
    } catch (e: any) {
      Alert.alert(
        'No se pudo guardar',
        e?.response?.data?.message || 'Intenta de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen padded={false}>
      <Header title="Mi vehículo" eyebrow="REPARTIDOR" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="glass" padding={s.md} borderRadius={radius.lg} style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <Text style={styles.introText}>
            Tus clientes verán estos datos cuando aceptes su pedido. Mantén la
            placa actualizada para tu seguridad y la suya.
          </Text>
        </Card>

        {/* Tipo de vehículo — segmented control de 3 opciones */}
        <Text style={styles.sectionLabel}>TIPO DE VEHÍCULO</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => {
            const active = vehicleType === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.typeCard, active && styles.typeCardActive]}
                onPress={() => setVehicleType(t.key)}
                activeOpacity={0.85}
              >
                <View
                  style={[styles.typeIcon, active && styles.typeIconActive]}
                >
                  <Ionicons
                    name={t.icon}
                    size={22}
                    color={active ? colors.primary : colors.textMuted}
                  />
                </View>
                <Text
                  style={[styles.typeLabel, active && styles.typeLabelActive]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Placa, modelo, color */}
        <View style={styles.formBlock}>
          <Input
            variant="filled"
            label="Placa"
            placeholder={vehicleType === 'bicycle' ? 'Opcional para bici' : 'ABC-123'}
            value={plate}
            onChangeText={setPlate}
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formBlock}>
          <Input
            variant="filled"
            label="Modelo"
            placeholder={
              vehicleType === 'bicycle'
                ? 'Mountain bike, ruta, etc.'
                : vehicleType === 'motorcycle'
                  ? 'Italika, Yamaha, etc.'
                  : 'Nissan March, Chevy, etc.'
            }
            value={model}
            onChangeText={setModel}
          />
        </View>

        <View style={styles.formBlock}>
          <Input
            variant="filled"
            label="Color"
            placeholder="Rojo, blanco, azul…"
            value={color}
            onChangeText={setColor}
          />
        </View>

        <View style={styles.actionWrap}>
          <Button
            label="GUARDAR VEHÍCULO"
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

  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
  },

  typeRow: {
    flexDirection: 'row',
    gap: s.xs,
    marginBottom: s.lg,
  },
  typeCard: {
    flex: 1,
    padding: s.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeCardActive: {
    backgroundColor: 'rgba(255,194,14,0.08)',
    borderColor: colors.primary,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.xs,
  },
  typeIconActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: 'rgba(255,194,14,0.32)',
  },
  typeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  typeLabelActive: { color: colors.primary },

  formBlock: { marginBottom: s.md },
  actionWrap: { marginTop: s.lg },
});
