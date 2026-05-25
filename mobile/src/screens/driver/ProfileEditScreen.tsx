// ==========================================
// DEVOLÓN — Editar perfil del rider
//
// Foto, nombre, apellido, teléfono, fecha de nacimiento y CURP.
// El email es read-only (es el login). Al guardar llama
// authApi.updateProfile y refresca el usuario en el store.
// ==========================================

import React, { useState } from 'react';
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

export default function DriverProfileEditScreen() {
  const navigation = useNavigation<any>();
  const { user, updateProfile } = useAuthStore() as any;

  const [name, setName] = useState(user?.name || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [curp, setCurp] = useState(user?.curp || '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [saving, setSaving] = useState(false);

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
      // Base64 data URI — el backend recibirá esto en updateProfile.
      // Si tu backend prefiere multipart, ajusta acá.
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
        // Campos extra (backend los puede aceptar o ignorar).
        ...(birthDate ? ({ birthDate } as any) : {}),
        ...(curp ? ({ curp } as any) : {}),
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
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>RIDER · EDITAR</Text>
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
                    {(name || 'D').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={14} color={colors.onPrimary} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
          </View>

          {/* FORM */}
          <View style={styles.form}>
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

            <Field
              label="CURP"
              value={curp}
              onChangeText={(t) => setCurp(t.toUpperCase())}
              placeholder="18 caracteres"
              icon="card-outline"
              maxLength={18}
              autoCapitalize="characters"
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
                <Text style={styles.saveBtnText}>GUARDAR CAMBIOS</Text>
              </>
            )}
          </TouchableOpacity>

          {/* INFO */}
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
              Para cambiar tu vehículo o placas, ve a "Mi vehículo" en el perfil.
              Los documentos (INE, licencia, etc.) se gestionan con soporte.
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
  editable = true,
  hint,
  maxLength,
  autoCapitalize,
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
  autoCapitalize?: any;
}) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <View
        style={[
          fieldStyles.input,
          !editable && fieldStyles.inputDisabled,
        ]}
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
          autoCapitalize={autoCapitalize}
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
  inputDisabled: {
    backgroundColor: colors.bgRaised,
    opacity: 0.7,
  },
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

  scroll: {
    paddingHorizontal: s.xl,
    paddingBottom: s['4xl'],
  },

  avatarSection: {
    alignItems: 'center',
    marginVertical: s.lg,
  },
  avatarWrap: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
  },
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

  form: { marginTop: s.sm },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 54,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: s.md,
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
});
