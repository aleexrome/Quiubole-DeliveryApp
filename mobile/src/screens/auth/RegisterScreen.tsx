// ==========================================
// REGISTER — Devolón
//
// Consistencia visual con LoginScreen V4:
//   - Hero cinematográfico arriba (imagenlogin.png), 30% para dejar
//     espacio al form de 5 campos + selector de rol.
//   - Mismo overlay leve + fade al bg.
//   - Mismo headline pattern (acento amarillo bajo título).
//   - Mismo CTA glow.
//
// Diferencias deliberadas vs login:
//   - Inputs BOXED dark (no underline) porque hay 5 campos + role selector
//     y la densidad pide contenedor claro. Misma paleta, distinta shape.
//   - Ghost D absoluto detrás del contenido (opacity 0.04) — watermark
//     brand sutil que solo aparece en pantallas largas.
//
// Lógica preservada: register({ name, email, phone, password, role })
// con validaciones idénticas a la versión anterior.
// ==========================================

import React, { useState, useEffect } from 'react';
import { zonesApi } from '../../services/api';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import IsotypeD from '../../components/IsotypeD';
import {
  colors,
  s,
  radius,
  textStyles,
  shadows,
  fontWeight,
  fontSize,
} from '../../theme';

const { height: SCREEN_H } = Dimensions.get('window');
const HERO_HEIGHT = Math.round(SCREEN_H * 0.30);

type RoleOption = {
  value: UserRole;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

const ROLES: RoleOption[] = [
  { value: 'customer', label: 'Cliente', icon: 'person-outline', description: 'Pedir' },
  { value: 'restaurant', label: 'Negocio', icon: 'business-outline', description: 'Vender' },
  { value: 'driver', label: 'Repartidor', icon: 'bicycle-outline', description: 'Repartir' },
];

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register, isLoading } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('customer');
  const [focus, setFocus] = useState<string | null>(null);

  // Zonas activas — vienen del backend (por ahora solo Tenancingo).
  // El usuario DEBE elegir una para que el feed pueda filtrar restaurantes.
  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [zonePickerOpen, setZonePickerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await zonesApi.getActive();
        setZones(data || []);
        // Si solo hay una zona activa, la preseleccionamos (Tenancingo MVP).
        if (data && data.length === 1) {
          setSelectedZone(data[0].name);
        }
      } catch (e) {
        // Si el backend no responde, no bloqueamos el registro — el
        // usuario puede crear cuenta sin zona y la pedimos después.
      }
    })();
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      Alert.alert('Faltan datos', 'Completa todos los campos para continuar.');
      return;
    }
    if (!selectedZone) {
      Alert.alert(
        'Falta la zona',
        'Selecciona el municipio donde vas a usar Devolón.',
      );
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Contraseña', 'Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Contraseña', 'Mínimo 8 caracteres.');
      return;
    }
    try {
      await register({
        name,
        email,
        phone,
        password,
        role,
        zone: selectedZone,
      } as any);
    } catch (e: any) {
      Alert.alert('No pudimos crear la cuenta', e?.message || 'Intenta de nuevo.');
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} translucent={false} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ============ HERO ============ */}
          <View style={styles.hero}>
            <Image
              source={require('../../../assets/brand/crearcuenta.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <View style={styles.heroOverlay} />
            <LinearGradient
              colors={['transparent', colors.bg]}
              locations={[0, 1]}
              style={styles.heroFade}
            />

            {/* Back button overlaid */}
            <SafeAreaView edges={['top']} style={styles.heroTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={22} color={colors.text} />
              </TouchableOpacity>
            </SafeAreaView>
          </View>

          {/* ============ CONTENIDO ============ */}
          <View style={styles.below}>
            {/* Ghost D — watermark sutil, partially cropped right */}
            <IsotypeD
              size={520}
              tint={colors.primary}
              style={styles.ghostD}
            />

            {/* Header */}
            <View style={styles.headlineBlock}>
              <Text style={styles.title}>Crea tu cuenta</Text>
              <Text style={styles.subtitle}>
                Todo lo que necesitas, ya va en camino.
              </Text>
              <View style={styles.headlineDivider} />
            </View>

            {/* ============ ROLE PILLS ============ */}
            <Text style={styles.sectionEyebrow}>¿CÓMO QUIERES USAR DEVOLÓN?</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => {
                const selected = role === r.value;
                return (
                  <TouchableOpacity
                    key={r.value}
                    onPress={() => setRole(r.value)}
                    activeOpacity={0.85}
                    style={[styles.rolePill, selected && styles.rolePillSelected]}
                  >
                    <Ionicons
                      name={r.icon}
                      size={22}
                      color={selected ? colors.primary : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.roleLabel,
                        selected && styles.roleLabelSelected,
                      ]}
                    >
                      {r.label}
                    </Text>
                    <Text style={styles.roleDescription}>{r.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ============ ZONA ============
                Dropdown de municipio. Por ahora MVP solo Tenancingo. */}
            <Text style={styles.sectionEyebrow}>ZONA</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setZonePickerOpen(true)}
              style={styles.zoneSelector}
            >
              <Ionicons
                name="location"
                size={18}
                color={selectedZone ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.zoneSelectorText,
                  !selectedZone && styles.zoneSelectorPlaceholder,
                ]}
              >
                {selectedZone || 'Elige tu municipio'}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.zoneHint}>
              Por ahora operamos solo en Tenancingo. Próximamente más zonas.
            </Text>

            {/* Picker modal — implementación simple sin librería extra */}
            {zonePickerOpen && (
              <View style={styles.zonePickerOverlay}>
                <View style={styles.zonePickerSheet}>
                  <Text style={styles.zonePickerTitle}>Selecciona tu zona</Text>
                  {zones.length === 0 ? (
                    <Text style={styles.zonePickerEmpty}>
                      No hay zonas activas. Conéctate a internet e intenta de nuevo.
                    </Text>
                  ) : (
                    zones.map((z) => {
                      const active = selectedZone === z.name;
                      return (
                        <TouchableOpacity
                          key={z.id}
                          activeOpacity={0.85}
                          onPress={() => {
                            setSelectedZone(z.name);
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

            {/* ============ FORM ============ */}
            <View style={styles.form}>
              <FormField
                icon="person-outline"
                placeholder="Nombre completo"
                value={name}
                onChangeText={setName}
                focused={focus === 'name'}
                onFocus={() => setFocus('name')}
                onBlur={() => setFocus(null)}
                autoCapitalize="words"
              />

              <FormField
                icon="mail-outline"
                placeholder="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                focused={focus === 'email'}
                onFocus={() => setFocus('email')}
                onBlur={() => setFocus(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <FormField
                icon="call-outline"
                placeholder="Teléfono (10 dígitos)"
                value={phone}
                onChangeText={setPhone}
                focused={focus === 'phone'}
                onFocus={() => setFocus('phone')}
                onBlur={() => setFocus(null)}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <FormField
                icon="lock-closed-outline"
                placeholder="Contraseña (mín. 8 caracteres)"
                value={password}
                onChangeText={setPassword}
                focused={focus === 'password'}
                onFocus={() => setFocus('password')}
                onBlur={() => setFocus(null)}
                secureTextEntry={!showPassword}
                right={
                  <TouchableOpacity
                    onPress={() => setShowPassword((p) => !p)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                }
              />

              <FormField
                icon="lock-closed-outline"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                focused={focus === 'confirmPassword'}
                onFocus={() => setFocus('confirmPassword')}
                onBlur={() => setFocus(null)}
                secureTextEntry={!showPassword}
              />

              {/* Terms */}
              <Text style={styles.terms}>
                Al continuar aceptas los{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('Terms')}
                >
                  Términos
                </Text>{' '}
                y la{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => navigation.navigate('Privacy')}
                >
                  Privacidad
                </Text>
                .
              </Text>

              {/* CTA */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleRegister}
                disabled={isLoading}
                style={[styles.cta, isLoading && styles.ctaDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.ctaText}>CREAR CUENTA</Text>
                )}
              </TouchableOpacity>

              {/* Login link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginLead}>¿Ya tienes cuenta?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.loginLink}>Inicia sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ===================== FormField subcomponent ===================== */
// Input boxed dark con ícono izquierdo + slot derecho opcional (eye, etc).
// Focus → border amarillo. Mismo lenguaje cromático que login.

type FieldProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  keyboardType?: any;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  maxLength?: number;
  right?: React.ReactNode;
};

function FormField({
  icon,
  placeholder,
  value,
  onChangeText,
  focused,
  onFocus,
  onBlur,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
  autoCorrect,
  maxLength,
  right,
}: FieldProps) {
  return (
    <View style={[styles.field, focused && styles.fieldFocus]}>
      <Ionicons
        name={icon}
        size={18}
        color={focused ? colors.primary : colors.textFaint}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        maxLength={maxLength}
        selectionColor={colors.primary}
      />
      {right}
    </View>
  );
}

/* ===================== Styles ===================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
  },

  // ============ HERO ============
  hero: {
    width: '100%',
    height: HERO_HEIGHT,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  heroImage: {
    // `contain` muestra la imagen entera centrada dentro del hero, sin
    // recortar. El container tiene bg negro, así que las bandas que
    // sobren se funden con el bg de la app — sin gaps visibles.
    // Diferencia vs LoginScreen: ahí la imagen es landscape full-bleed
    // y `cover` luce mejor; aquí es portrait y `cover` recortaba la cara.
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '40%',
  },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: s.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ BELOW (content) ============
  below: {
    paddingHorizontal: s.xl,
    paddingTop: s.lg,
    paddingBottom: s['2xl'],
    position: 'relative',
    overflow: 'hidden',
  },

  // Ghost D watermark — absolute, partially off-screen right
  ghostD: {
    position: 'absolute',
    right: -180,
    top: 80,
    opacity: 0.04,
  },

  // ============ Headline ============
  headlineBlock: {
    alignItems: 'center',
    marginBottom: s.xl,
    paddingHorizontal: s.xs,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: fontWeight.medium,
    marginTop: s.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  headlineDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: s.md,
    opacity: 0.9,
  },

  // ============ Role pills (segmented premium) ============
  sectionEyebrow: {
    ...textStyles.eyebrow,
    color: colors.textMuted,
    marginBottom: s.sm,
    textAlign: 'center',
  },

  // ============ Zone selector + picker modal ============
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
    marginBottom: 6,
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
  zoneHint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginBottom: s.md,
    paddingHorizontal: 4,
  },
  zonePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    paddingHorizontal: s.xl,
    zIndex: 100,
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
  roleRow: {
    flexDirection: 'row',
    gap: s.sm - 2,
    marginBottom: s.xl,
  },
  rolePill: {
    flex: 1,
    paddingVertical: s.md,
    paddingHorizontal: s.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 4,
  },
  rolePillSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,194,14,0.08)',
    ...shadows.glow,
  },
  roleLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: fontWeight.heavy,
    marginTop: s.xxs,
    letterSpacing: 0.2,
  },
  roleLabelSelected: {
    color: colors.primary,
  },
  roleDescription: {
    color: colors.textFaint,
    fontSize: 10,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  // ============ Form ============
  form: {},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.inputBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: s.md,
    height: 54,
    marginBottom: s.sm,
  },
  fieldFocus: {
    borderColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: fontWeight.medium,
    color: colors.text,
    paddingVertical: 0,
  },

  // ============ Terms ============
  terms: {
    color: colors.textFaint,
    textAlign: 'center',
    fontSize: 11,
    marginTop: s.md,
    marginBottom: s.lg,
    paddingHorizontal: s.sm,
    lineHeight: 16,
  },
  termsLink: {
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },

  // ============ CTA ============
  cta: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  ctaDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    ...textStyles.cta,
    color: colors.onPrimary,
    letterSpacing: 2.4,
    fontSize: 14,
  },

  // ============ Login link ============
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s.xs,
    marginTop: s.xl,
  },
  loginLead: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: fontWeight.medium,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
});
