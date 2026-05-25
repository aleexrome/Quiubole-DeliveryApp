// ==========================================
// DEVOLÓN — Customer / Editar perfil
//
// Foto, nombre, apellidos, teléfono, fecha de nacimiento, dirección
// principal y zona. Email read-only (login). Guardar llama
// updateProfile del authStore que dispara la API.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import { zonesApi } from '../../services/api';
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

export default function CustomerProfileEditScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuthStore() as any;

  const [name, setName] = useState(user?.name || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [zone, setZone] = useState<string | null>(user?.zone || null);
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([]);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);

  // Dirección principal (la gestión completa de múltiples direcciones la
  // dejamos para una pantalla aparte más adelante).
  const [street, setStreet] = useState(user?.address?.street || '');
  const [number, setNumber] = useState(user?.address?.number || '');
  const [neighborhood, setNeighborhood] = useState(
    user?.address?.neighborhood || '',
  );
  const [zipCode, setZipCode] = useState(user?.address?.zipCode || '');
  const [reference, setReference] = useState(
    user?.address?.reference || '',
  );

  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await zonesApi.getActive();
        setZones(list || []);
      } catch {
        /* silent */
      }
    })();
  }, []);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tus fotos para cambiar tu avatar.',
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const uri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;
      setAvatar(uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'El nombre no puede estar vacío.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Falta el teléfono', 'El teléfono no puede estar vacío.');
      return;
    }
    try {
      setSaving(true);
      await updateProfile({
        name: name.trim(),
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        phone: phone.trim(),
        avatar: avatar || undefined,
        ...(birthDate ? ({ birthDate } as any) : {}),
        ...(zone ? ({ zone } as any) : {}),
        address: {
          street: street.trim(),
          number: number.trim(),
          neighborhood: neighborhood.trim(),
          zipCode: zipCode.trim(),
          reference: reference.trim(),
        } as any,
      } as any);
      Alert.alert('Listo', 'Perfil actualizado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.response?.data?.message ||
          'Revisa tu conexión e intenta de nuevo.',
      );
    } finally {
      setSaving(false);
    }
  };

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
            <Text style={styles.eyebrow}>CUENTA · EDITAR</Text>
            <Text style={styles.headerTitle}>Mi información</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* AVATAR */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={pickAvatar}
              style={styles.avatarWrap}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color={colors.onPrimary} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
          </View>

          {/* DATOS PERSONALES */}
          <Text style={styles.groupTitle}>DATOS PERSONALES</Text>
          <Field
            label="NOMBRE COMPLETO"
            value={name}
            onChangeText={setName}
            placeholder="Ej. Juan Pérez García"
            icon="person-outline"
          />
          <Field
            label="NOMBRE(S)"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Tu(s) nombre(s)"
            icon="person-circle-outline"
          />
          <Field
            label="APELLIDOS"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Apellido paterno y materno"
            icon="people-outline"
          />
          <Field
            label="TELÉFONO"
            value={phone}
            onChangeText={setPhone}
            placeholder="10 dígitos"
            icon="call-outline"
            keyboardType="phone-pad"
          />
          <Field
            label="EMAIL"
            value={user?.email || ''}
            onChangeText={() => {}}
            placeholder=""
            icon="mail-outline"
            editable={false}
            hint="No se puede cambiar (es tu inicio de sesión)"
          />
          <Field
            label="FECHA DE NACIMIENTO"
            value={birthDate}
            onChangeText={setBirthDate}
            placeholder="DD/MM/AAAA"
            icon="calendar-outline"
          />

          {/* ZONA */}
          <Text style={styles.groupTitle}>ZONA</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setZonePickerOpen(true)}
            style={styles.zoneSelector}
          >
            <Ionicons
              name="location"
              size={18}
              color={zone ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.zoneSelectorText,
                !zone && styles.zoneSelectorPlaceholder,
              ]}
            >
              {zone || 'Elige tu municipio'}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          {/* DIRECCIÓN PRINCIPAL */}
          <Text style={styles.groupTitle}>DIRECCIÓN PRINCIPAL</Text>
          <Field
            label="CALLE"
            value={street}
            onChangeText={setStreet}
            placeholder="Nombre de la calle"
            icon="home-outline"
          />
          <View style={styles.row2}>
            <View style={styles.row2Item}>
              <Field
                label="NÚMERO"
                value={number}
                onChangeText={setNumber}
                placeholder="Ext / Int"
                icon="pin-outline"
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
            label="COLONIA"
            value={neighborhood}
            onChangeText={setNeighborhood}
            placeholder="Colonia o barrio"
            icon="map-outline"
          />
          <Field
            label="REFERENCIA (opcional)"
            value={reference}
            onChangeText={setReference}
            placeholder="Casa color azul, frente al parque…"
            icon="navigate-outline"
          />

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
                <Ionicons name="checkmark" size={20} color={colors.onPrimary} />
                <Text style={styles.saveBtnText}>GUARDAR CAMBIOS</Text>
              </>
            )}
          </TouchableOpacity>

          <Card
            variant="glass"
            padding={s.md}
            borderRadius={radius.lg}
            style={styles.infoCard}
          >
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={styles.infoText}>
              Para gestionar múltiples direcciones de entrega (casa, oficina,
              etc.) y métodos de pago, próximamente desde tu perfil.
            </Text>
          </Card>
        </ScrollView>

        {/* Picker de zona */}
        {zonePickerOpen && (
          <View style={styles.zonePickerOverlay}>
            <View style={styles.zonePickerSheet}>
              <Text style={styles.zonePickerTitle}>Selecciona tu zona</Text>
              {zones.length === 0 ? (
                <Text style={styles.zonePickerEmpty}>
                  No hay zonas activas.
                </Text>
              ) : (
                zones.map((z) => {
                  const active = zone === z.name;
                  return (
                    <TouchableOpacity
                      key={z.id}
                      activeOpacity={0.85}
                      onPress={() => {
                        setZone(z.name);
                        setZonePickerOpen(false);
                      }}
                      style={[
                        styles.zonePickerOption,
                        active && styles.zonePickerOptionActive,
                      ]}
                    >
                      <Ionicons
                        name="location"
                        size={18}
                        color={active ? colors.primary : colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.zonePickerOptionText,
                          active && styles.zonePickerOptionTextActive,
                        ]}
                      >
                        {z.name}
                      </Text>
                      {active && (
                        <Ionicons
                          name="checkmark-circle"
                          size={18}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
              <TouchableOpacity
                onPress={() => setZonePickerOpen(false)}
                style={styles.zonePickerCancel}
              >
                <Text style={styles.zonePickerCancelText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  editable = true,
  hint,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: any;
  editable?: boolean;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View
        style={[fieldStyles.input, !editable && fieldStyles.inputDisabled]}
      >
        <Ionicons name={icon} size={18} color={colors.textMuted} />
        <TextInput
          style={fieldStyles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          keyboardType={keyboardType}
          editable={editable}
          maxLength={maxLength}
        />
      </View>
      {hint && <Text style={fieldStyles.hint}>{hint}</Text>}
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
  inputDisabled: { backgroundColor: colors.bgRaised, opacity: 0.7 },
  textInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 4,
    paddingLeft: 4,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

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

  scroll: { paddingHorizontal: s.xl, paddingBottom: s['4xl'] },

  avatarSection: { alignItems: 'center', marginVertical: s.lg },
  avatarWrap: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 112, height: 112, borderRadius: radius.pill },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.bg,
  },
  avatarHint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: s.sm,
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

  zoneSelector: {
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
  zoneSelectorText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  zoneSelectorPlaceholder: {
    color: colors.textFaint,
    fontWeight: fontWeight.medium,
  },

  row2: { flexDirection: 'row', gap: s.xs },
  row2Item: { flex: 1 },

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

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: s.sm,
    marginTop: s.lg,
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },

  // Zone picker modal
  zonePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: s.xl,
  },
  zonePickerSheet: {
    backgroundColor: colors.bgRaised,
    borderRadius: radius.xl,
    padding: s.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  zonePickerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.3,
    marginBottom: s.md,
  },
  zonePickerEmpty: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    paddingVertical: s.lg,
  },
  zonePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    paddingHorizontal: s.md,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  zonePickerOptionActive: {
    backgroundColor: 'rgba(255,194,14,0.10)',
    borderColor: colors.primary,
  },
  zonePickerOptionText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  zonePickerOptionTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.heavy,
  },
  zonePickerCancel: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    marginTop: s.sm,
  },
  zonePickerCancelText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
});
