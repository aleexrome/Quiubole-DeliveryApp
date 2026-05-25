// ==========================================
// DEVOLÓN — Customer / Editar dirección
//
// Crear o editar una dirección guardada. Botón hero "Usar mi ubicación
// actual" hace GPS + reverse-geocode y rellena los campos automáticamente.
// Todos los campos son editables a mano por si el autocompletado falla
// (común en colonias chicas / direcciones complejas).
//
// Route params: { addressId: string | null }
//   - null → modo crear
//   - id  → modo editar (carga la dirección existente)
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Location from 'expo-location';
import { addressesApi } from '../../services/api';
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

type LabelKey = 'home' | 'work' | 'other';

const LABEL_OPTIONS: { key: LabelKey; display: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'home', display: 'Casa', icon: 'home' },
  { key: 'work', display: 'Oficina', icon: 'briefcase' },
  { key: 'other', display: 'Otra', icon: 'location' },
];

export default function CustomerAddressEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const addressId: string | null = route.params?.addressId ?? null;
  const isNew = !addressId;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  // Form state
  const [label, setLabel] = useState<LabelKey>('home');
  const [street, setStreet] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setStateField] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('México');
  const [instructions, setInstructions] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isDefault, setIsDefault] = useState(false);

  // Cargar dirección existente si es edición.
  useEffect(() => {
    if (!addressId) return;
    (async () => {
      try {
        const data = await addressesApi.getById(addressId);
        setLabel((data.label as LabelKey) || 'home');
        setStreet(data.street || '');
        setApartment(data.apartment || '');
        setCity(data.city || '');
        setStateField(data.state || '');
        setZipCode(data.zipCode || '');
        setCountry(data.country || 'México');
        setInstructions(data.instructions || '');
        setLatitude(Number(data.latitude) || null);
        setLongitude(Number(data.longitude) || null);
        setIsDefault(!!data.isDefault);
      } catch (error: any) {
        Alert.alert(
          'Error',
          error?.response?.data?.message || 'No se pudo cargar la dirección',
        );
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [addressId]);

  // ============================================
  // AUTOCOMPLETADO VÍA GPS
  // El usuario toca "Usar mi ubicación" → pedimos permisos → coords →
  // reverseGeocode → rellenamos los campos. El user puede ajustar lo que
  // no haya quedado correcto (caso común: la API regresa "Calle X" sin
  // número, o la colonia mal).
  // ============================================
  const detectFromGps = async () => {
    setLocating(true);
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos tu ubicación para autocompletar la dirección. Edita los campos a mano si prefieres.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLatitude(pos.coords.latitude);
      setLongitude(pos.coords.longitude);

      const results = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const place = results?.[0];
      if (place) {
        const streetParts = [place.street, place.streetNumber]
          .filter(Boolean)
          .join(' ');
        if (streetParts) setStreet(streetParts);
        if (place.district || place.subregion) {
          // En reverse-geocode de iOS/Android, district suele ser la
          // colonia y subregion el municipio.
          // No tenemos campo separado de colonia; lo metemos como parte
          // del street si no se llenó algo más útil.
          if (!streetParts && place.district) {
            setStreet(place.district);
          }
        }
        if (place.city) setCity(place.city);
        else if (place.subregion) setCity(place.subregion);
        if (place.region) setStateField(place.region);
        if (place.postalCode) setZipCode(place.postalCode);
        if (place.country) setCountry(place.country);
      }

      Alert.alert(
        'Ubicación detectada',
        'Revisa los campos y corrige lo que necesites (número exterior, colonia, etc.).',
      );
    } catch (error: any) {
      Alert.alert(
        'No se pudo detectar',
        error?.message || 'Activa el GPS e intenta de nuevo.',
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!street.trim()) {
      Alert.alert('Falta la calle', 'Ingresa la dirección o usa tu ubicación.');
      return;
    }
    if (latitude == null || longitude == null) {
      Alert.alert(
        'Falta ubicación',
        'Toca "Usar mi ubicación actual" para registrar las coordenadas. Sin ellas el rider no puede llegar.',
      );
      return;
    }
    try {
      setSaving(true);
      const payload = {
        label,
        street: street.trim(),
        apartment: apartment.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
        country: country.trim() || undefined,
        instructions: instructions.trim() || undefined,
        latitude,
        longitude,
        isDefault,
      };
      if (isNew) {
        await addressesApi.create(payload);
      } else if (addressId) {
        await addressesApi.update(addressId, payload);
      }
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.response?.data?.message || 'Intenta de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>DIRECCIÓN</Text>
            <Text style={styles.headerTitle}>
              {isNew ? 'Nueva dirección' : 'Editar dirección'}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* GPS HERO */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={detectFromGps}
            disabled={locating}
            style={[styles.gpsBtn, locating && styles.gpsBtnDisabled]}
          >
            <View style={styles.gpsIcon}>
              {locating ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Ionicons name="locate" size={22} color={colors.onPrimary} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gpsTitle}>
                {locating ? 'Detectando…' : 'Usar mi ubicación actual'}
              </Text>
              <Text style={styles.gpsSub}>
                Llena calle, colonia y CP automáticamente. Edítalo después.
              </Text>
            </View>
          </TouchableOpacity>

          {latitude != null && longitude != null && (
            <Text style={styles.coordsText}>
              Coords: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </Text>
          )}

          {/* LABEL */}
          <Text style={styles.groupTitle}>ETIQUETA</Text>
          <View style={styles.labelRow}>
            {LABEL_OPTIONS.map((opt) => {
              const active = label === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.85}
                  onPress={() => setLabel(opt.key)}
                  style={[
                    styles.labelChip,
                    active && styles.labelChipActive,
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={active ? colors.onPrimary : colors.primary}
                  />
                  <Text
                    style={[
                      styles.labelChipText,
                      active && styles.labelChipTextActive,
                    ]}
                  >
                    {opt.display}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* CAMPOS */}
          <Text style={styles.groupTitle}>DIRECCIÓN</Text>
          <Field
            label="CALLE Y NÚMERO"
            value={street}
            onChangeText={setStreet}
            placeholder="Ej. Av. Insurgentes Sur 1234"
            icon="home-outline"
          />
          <Field
            label="DEPTO / INTERIOR (opcional)"
            value={apartment}
            onChangeText={setApartment}
            placeholder="Ej. Depto 5B, casa de atrás"
            icon="pin-outline"
          />
          <View style={styles.row2}>
            <View style={styles.row2Item}>
              <Field
                label="CIUDAD"
                value={city}
                onChangeText={setCity}
                placeholder="Ej. Tenancingo"
                icon="business-outline"
              />
            </View>
            <View style={styles.row2Item}>
              <Field
                label="CP"
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="5 dígitos"
                icon="mail-open-outline"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>
          </View>
          <Field
            label="ESTADO"
            value={state}
            onChangeText={setStateField}
            placeholder="Ej. Estado de México"
            icon="flag-outline"
          />

          <Text style={styles.groupTitle}>REFERENCIA (opcional)</Text>
          <Field
            label="DESCRIPCIÓN PARA EL REPARTIDOR"
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Casa color azul, portón negro, timbre roto…"
            icon="navigate-outline"
            multiline
          />

          {/* DEFAULT */}
          <View style={styles.defaultRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.defaultLabel}>Marcar como predeterminada</Text>
              <Text style={styles.defaultSub}>
                Se selecciona por defecto al hacer un pedido.
              </Text>
            </View>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.text}
            />
          </View>

          {/* SAVE */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            {saving ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={colors.onPrimary}
                />
                <Text style={styles.saveBtnText}>
                  {isNew ? 'GUARDAR DIRECCIÓN' : 'GUARDAR CAMBIOS'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Card
            variant="glass"
            padding={s.md}
            borderRadius={radius.lg}
            style={styles.tipCard}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.tipText}>
              Si el autocompletado no es exacto, ajusta los campos a mano —
              esto pasa seguido en colonias chicas o direcciones nuevas.
            </Text>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============ FIELD ============
function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  maxLength,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: any;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View
        style={[
          fieldStyles.input,
          multiline && fieldStyles.inputMultiline,
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color={colors.textMuted}
          style={multiline ? { marginTop: 4 } : undefined}
        />
        <TextInput
          style={[fieldStyles.textInput, multiline && fieldStyles.textInputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboardType}
          maxLength={maxLength}
          multiline={multiline}
        />
      </View>
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: s.md },
  label: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
    marginBottom: 6,
    paddingLeft: 4,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    paddingHorizontal: s.md,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputMultiline: {
    alignItems: 'flex-start',
    minHeight: 72,
    paddingVertical: s.sm,
  },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  textInputMultiline: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    marginTop: 2,
  },

  scroll: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
  },

  // GPS HERO BUTTON
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    paddingHorizontal: s.lg,
    paddingVertical: s.md,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    ...shadows.glow,
  },
  gpsBtnDisabled: { opacity: 0.7 },
  gpsIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsTitle: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  gpsSub: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },
  coordsText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    fontFamily: 'monospace',
    marginTop: 6,
    paddingLeft: s.sm,
  },

  groupTitle: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginTop: s.lg,
    marginBottom: s.sm,
    paddingLeft: s.xs,
  },

  // LABEL CHIPS
  labelRow: { flexDirection: 'row', gap: s.xs },
  labelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  labelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelChipText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  labelChipTextActive: { color: colors.onPrimary },

  row2: { flexDirection: 'row', gap: s.xs },
  row2Item: { flex: 1 },

  // DEFAULT toggle
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    paddingHorizontal: s.md,
    paddingVertical: s.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: s.md,
  },
  defaultLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  defaultSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 2,
  },

  // SAVE
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: s.lg,
    ...shadows.glow,
  },
  saveBtnDisabled: { opacity: 0.55 },
  saveBtnText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },

  // TIP CARD
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
    marginTop: s.md,
  },
  tipText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },
});
