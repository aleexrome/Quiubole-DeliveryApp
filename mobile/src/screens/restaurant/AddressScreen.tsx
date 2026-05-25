// ==========================================
// DEVOLÓN — Restaurant Address
//
// Edición de dirección y ubicación (lat/lng). El dueño puede actualizar
// la dirección textual y las coordenadas. Persiste vía PATCH al restaurant.
// ==========================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { restaurantsApi } from '../../services/api';
import { Screen, Header, Card, Input, Button } from '../../components/ui';
import { colors, s, radius, fontSize, fontWeight, tracking } from '../../theme';

export default function RestaurantAddressScreen() {
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await restaurantsApi.getMyRestaurant();
      setAddress(r?.address || '');
      setLatitude(String(r?.latitude || ''));
      setLongitude(String(r?.longitude || ''));
    } catch (e: any) {
      console.error('Error loading address:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!address.trim()) {
      Alert.alert('Falta dirección', 'Escribe la dirección de tu negocio.');
      return;
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert(
        'Coordenadas inválidas',
        'La latitud y longitud deben ser números (ej. 19.4326, -99.1332).',
      );
      return;
    }
    setSaving(true);
    try {
      await restaurantsApi.updateMyRestaurant({
        address: address.trim(),
        latitude: lat,
        longitude: lng,
      } as any);
      Alert.alert('Listo', 'Tu dirección fue actualizada.');
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
        <Header title="Dirección" eyebrow="NEGOCIO" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Dirección" eyebrow="NEGOCIO" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="glass" padding={s.md} borderRadius={radius.lg} style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="information-circle" size={18} color={colors.primary} />
          </View>
          <Text style={styles.introText}>
            La dirección y ubicación se muestran a los clientes y se usan para
            calcular distancia de entrega.
          </Text>
        </Card>

        <View style={styles.formBlock}>
          <Text style={styles.sectionLabel}>DIRECCIÓN</Text>
          <Input
            variant="filled"
            placeholder="Calle, número, colonia, ciudad"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View style={styles.formBlock}>
          <Text style={styles.sectionLabel}>UBICACIÓN GPS</Text>
          <View style={styles.coordsRow}>
            <View style={{ flex: 1 }}>
              <Input
                variant="filled"
                label="Latitud"
                placeholder="19.4326"
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                variant="filled"
                label="Longitud"
                placeholder="-99.1332"
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
          <Text style={styles.hint}>
            Para obtener tus coordenadas: abre Google Maps, mantén presionada tu
            ubicación y copia los números que aparecen.
          </Text>
        </View>

        <View style={styles.actionWrap}>
          <Button
            label="GUARDAR DIRECCIÓN"
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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

  formBlock: { marginBottom: s.lg },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
  },
  coordsRow: {
    flexDirection: 'row',
    gap: s.sm,
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    marginTop: s.xs,
  },
  actionWrap: { marginTop: s.lg },
});
