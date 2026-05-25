// ==========================================
// DEVOLÓN — Editor / Editar info del restaurante
//
// Sub-screen del stack del editor (header nativo dark). Form denso
// agrupado en cards glass por sección:
//   1. Portada + logo (con halo amarillo cuando vacíos)
//   2. Info básica (nombre, descripción)
//   3. Contacto (teléfono, email)
//   4. Horarios (7 días, switch + 2 inputs HH:MM)
//
// CTA primario "Guardar cambios" al final.
// ==========================================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { restaurantsApi, editorsApi, uploadsApi } from '../../services/api';
import { Restaurant, OpeningHours } from '../../types';
import { Card, Input, Button } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const defaultHours = (): OpeningHours[] =>
  Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openTime: '09:00',
    closeTime: '22:00',
    isClosed: false,
  }));

// Normaliza lo que venga del backend (puede ser null, array parcial, etc.)
const normalizeHours = (raw: any): OpeningHours[] => {
  const base = defaultHours();
  if (!Array.isArray(raw)) return base;
  raw.forEach((h: any) => {
    if (h == null) return;
    const d = Number(h.dayOfWeek);
    if (Number.isInteger(d) && d >= 0 && d <= 6) {
      base[d] = {
        dayOfWeek: d,
        openTime: typeof h.openTime === 'string' ? h.openTime : '09:00',
        closeTime: typeof h.closeTime === 'string' ? h.closeTime : '22:00',
        isClosed: Boolean(h.isClosed),
      };
    }
  });
  return base;
};

const isValidTime = (v: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);

export default function EditorRestaurantEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurantId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState<OpeningHours[]>(defaultHours());

  useEffect(() => {
    navigation.setOptions({ headerTitle: 'Editar restaurante' });
    load();
  }, []);

  const load = async () => {
    try {
      const r: Restaurant = await restaurantsApi.getById(restaurantId);
      setName(r.name || '');
      setDescription(r.description || '');
      setLogo(r.logo || null);
      setCoverImage(r.coverImage || null);
      setPhone(r.phone || '');
      setEmail(r.email || '');
      setHours(normalizeHours((r as any).openingHours));
    } catch (e: any) {
      Alert.alert(
        'Error',
        e?.response?.data?.message || 'No se pudo cargar el restaurante',
      );
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (target: 'logo' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: target === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    const setUploading =
      target === 'logo' ? setUploadingLogo : setUploadingCover;
    const setImg = target === 'logo' ? setLogo : setCoverImage;
    setUploading(true);
    try {
      const res = await uploadsApi.uploadRestaurantImage(uri);
      const uploadedUrl =
        res.url || res.secure_url || res.path || res.filename || uri;
      setImg(uploadedUrl);
    } catch (e: any) {
      Alert.alert(
        'No se pudo subir',
        e?.response?.data?.message || String(e?.message || e),
      );
    } finally {
      setUploading(false);
    }
  };

  const updateHour = (
    dayOfWeek: number,
    patch: Partial<OpeningHours>,
  ) => {
    setHours((prev) =>
      prev.map((h) => (h.dayOfWeek === dayOfWeek ? { ...h, ...patch } : h)),
    );
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert(
        'Falta el nombre',
        'El nombre del restaurante es obligatorio',
      );
      return;
    }
    for (const h of hours) {
      if (h.isClosed) continue;
      if (!isValidTime(h.openTime) || !isValidTime(h.closeTime)) {
        Alert.alert(
          'Horario inválido',
          `Revisa el día ${DAY_LABELS[h.dayOfWeek]} (formato HH:MM, ej. 09:00).`,
        );
        return;
      }
    }
    setSaving(true);
    try {
      await editorsApi.updateRestaurant(restaurantId, {
        name: name.trim(),
        description: description.trim() || undefined,
        logo: logo || undefined,
        coverImage: coverImage || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        openingHours: hours,
      } as any);
      Alert.alert('Listo', 'Restaurante actualizado');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(
        'No se pudo guardar',
        e?.response?.data?.message || 'Intenta de nuevo',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============ COVER + LOGO ============ */}
        <Text style={styles.eyebrow}>IMAGEN</Text>

        <View style={styles.coverWrap}>
          <TouchableOpacity
            style={styles.coverPicker}
            onPress={() => pickImage('cover')}
            disabled={uploadingCover}
            activeOpacity={0.88}
          >
            {uploadingCover ? (
              <ActivityIndicator color={colors.primary} />
            ) : coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <View style={styles.coverHalo}>
                  <Ionicons
                    name="image-outline"
                    size={28}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.coverHint}>Toca para subir portada</Text>
              </View>
            )}
            <View style={styles.coverEditBadge}>
              <Ionicons name="camera" size={14} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>

          {/* Logo (sobre el cover) */}
          <TouchableOpacity
            style={styles.logoPicker}
            onPress={() => pickImage('logo')}
            disabled={uploadingLogo}
            activeOpacity={0.88}
          >
            {uploadingLogo ? (
              <ActivityIndicator color={colors.primary} />
            ) : logo ? (
              <Image source={{ uri: logo }} style={styles.logoImage} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons
                  name="restaurant"
                  size={24}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.logoEditBadge}>
              <Ionicons name="camera" size={11} color={colors.onPrimary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ============ INFO BÁSICA ============ */}
        <Text style={[styles.eyebrow, { marginTop: s['2xl'] }]}>
          INFO BÁSICA
        </Text>
        <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
          <Input
            variant="filled"
            label="Nombre *"
            value={name}
            onChangeText={setName}
            placeholder="Nombre del restaurante"
            containerStyle={{ marginBottom: s.sm }}
          />
          <Input
            variant="filled"
            label="Descripción"
            value={description}
            onChangeText={setDescription}
            placeholder="Cuéntale al cliente qué te hace único"
            multiline
            numberOfLines={3}
            style={{ minHeight: 80 } as any}
          />
        </Card>

        {/* ============ CONTACTO ============ */}
        <Text style={[styles.eyebrow, { marginTop: s.xl }]}>CONTACTO</Text>
        <Card variant="glass" padding={s.md} borderRadius={radius.xl}>
          <Input
            variant="filled"
            label="Teléfono"
            value={phone}
            onChangeText={setPhone}
            placeholder="55 1234 5678"
            keyboardType="phone-pad"
            icon="call-outline"
            containerStyle={{ marginBottom: s.sm }}
          />
          <Input
            variant="filled"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="hola@restaurante.com"
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail-outline"
          />
        </Card>

        {/* ============ HORARIOS ============ */}
        <Text style={[styles.eyebrow, { marginTop: s.xl }]}>HORARIOS</Text>
        <Text style={styles.hint}>
          Formato 24h (HH:MM). Desactiva el switch para marcar el día como
          cerrado.
        </Text>
        <Card variant="glass" padding={0} borderRadius={radius.xl}>
          {hours.map((h, idx) => {
            const open = !h.isClosed;
            const isLast = idx === hours.length - 1;
            return (
              <View
                key={h.dayOfWeek}
                style={[styles.hourRow, !isLast && styles.hourRowBorder]}
              >
                <Text style={styles.dayLabel}>
                  {DAY_LABELS[h.dayOfWeek].toUpperCase()}
                </Text>

                {open ? (
                  <View style={styles.timeInputs}>
                    <TextInput
                      style={styles.timeInput}
                      value={h.openTime}
                      onChangeText={(v) =>
                        updateHour(h.dayOfWeek, { openTime: v })
                      }
                      placeholder="09:00"
                      placeholderTextColor={colors.textFaint}
                      selectionColor={colors.primary}
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                    <Text style={styles.timeSep}>–</Text>
                    <TextInput
                      style={styles.timeInput}
                      value={h.closeTime}
                      onChangeText={(v) =>
                        updateHour(h.dayOfWeek, { closeTime: v })
                      }
                      placeholder="22:00"
                      placeholderTextColor={colors.textFaint}
                      selectionColor={colors.primary}
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                ) : (
                  <Text style={styles.closedLabel}>Cerrado</Text>
                )}

                <Switch
                  value={open}
                  onValueChange={(v) =>
                    updateHour(h.dayOfWeek, { isClosed: !v })
                  }
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.text}
                  ios_backgroundColor={colors.border}
                />
              </View>
            );
          })}
        </Card>

        {/* ============ GUARDAR ============ */}
        <View style={styles.saveWrap}>
          <Button
            label="Guardar cambios"
            onPress={save}
            loading={saving}
            icon="checkmark"
            iconPosition="right"
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: s.xl,
    paddingBottom: s['3xl'],
  },

  // ============ EYEBROW ============
  eyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.xs,
    paddingLeft: s.xxs,
  },
  hint: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: 16,
    marginBottom: s.sm,
    paddingLeft: s.xxs,
  },

  // ============ COVER + LOGO ============
  coverWrap: {
    position: 'relative',
    marginBottom: 44, // espacio para que el logo no choque con la siguiente sección
  },
  coverPicker: {
    height: 160,
    borderRadius: radius.xl,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
  },
  coverHalo: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverHint: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  coverEditBadge: {
    position: 'absolute',
    right: s.sm,
    bottom: s.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  logoPicker: {
    position: 'absolute',
    left: s.lg,
    bottom: -36,
    width: 76,
    height: 76,
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colors.bg,
    backgroundColor: colors.bgRaised,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  logoPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEditBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },

  // ============ HORARIOS ============
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    gap: s.sm,
  },
  hourRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayLabel: {
    width: 44,
    color: colors.text,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
  },
  timeInputs: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  timeInput: {
    flex: 1,
    maxWidth: 88,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: s.xs,
    paddingVertical: 8,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
  },
  timeSep: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
  },
  closedLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase',
  },

  // ============ SAVE ============
  saveWrap: {
    marginTop: s['2xl'],
  },
});
