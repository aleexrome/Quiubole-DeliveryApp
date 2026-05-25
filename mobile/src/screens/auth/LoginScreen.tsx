// ==========================================
// LOGIN V3 — Devolón
//
// Hero cinematográfico: imagen oficial 3D del rider (`imagenlogin.png`)
// cubriendo el 55% superior con overlay negro + fade-out bottom hacia
// el bg de la app. El formulario flota integrado al branding, sin card.
//
// Splash: SOLO el nativo (Android, vía colors.xml + drawable). El JS
// splash overlay anterior (D + DEVOLÓN con fade) fue eliminado — era
// el causante del "doble splash". Cold start ahora: native splash D
// → directo al LoginScreen, sin pantalla intermedia.
// ==========================================

import React, { useState } from 'react';
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
const HERO_HEIGHT = Math.round(SCREEN_H * 0.55);

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert(
        'No se pudo iniciar sesión',
        e?.message || 'Revisa tus credenciales e intenta de nuevo.',
      );
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
          {/* ============ HERO CINEMATOGRÁFICO ============ */}
          <View style={styles.hero}>
            <Image
              source={require('../../../assets/brand/imagenlogin.png')}
              style={styles.heroImage}
              resizeMode="cover"
            />
            {/* Overlay MUY ligero — solo unifica el negro de la imagen
                con el bg de la app. Deja respirar el glow amarillo. */}
            <View style={styles.heroOverlay} />
            {/* Fade vertical inferior: corto y limpio, transparente → bg.
                Sin parada intermedia oscura para no apagar la moto. */}
            <LinearGradient
              colors={['transparent', colors.bg]}
              locations={[0, 1]}
              style={styles.heroFade}
            />
          </View>

          {/* ============ CONTENIDO INFERIOR ============ */}
          <View style={styles.below}>
            {/* Headline publicitario — centrado, editorial */}
            <View style={styles.headlineBlock}>
              <Text style={styles.headline}>Todo lo que necesitas,</Text>
              <Text style={[styles.headline, styles.headlineAccent]}>
                ya va en camino.
              </Text>
            </View>

            <View style={styles.headlineDivider} />

            {/* Form: underline minimal */}
            <View style={styles.form}>
              <View style={[styles.field, focus === 'email' && styles.fieldFocus]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={focus === 'email' ? colors.primary : colors.textFaint}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor={colors.textFaint}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  selectionColor={colors.primary}
                  onFocus={() => setFocus('email')}
                  onBlur={() => setFocus(null)}
                />
              </View>

              <View style={[styles.field, focus === 'password' && styles.fieldFocus]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={focus === 'password' ? colors.primary : colors.textFaint}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.textFaint}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  selectionColor={colors.primary}
                  onFocus={() => setFocus('password')}
                  onBlur={() => setFocus(null)}
                />
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
              </View>

              <TouchableOpacity
                style={styles.forgot}
                onPress={() => navigation.navigate('ForgotPassword')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              {/* CTA primario */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleLogin}
                disabled={isLoading}
                style={[styles.cta, isLoading && styles.ctaDisabled]}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.onPrimary} />
                ) : (
                  <Text style={styles.ctaText}>INICIAR SESIÓN</Text>
                )}
              </TouchableOpacity>

              {/* Social — buttons grandes, full-width, balance simétrico */}
              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={22} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Crear cuenta — fila propia centrada */}
              <View style={styles.registerRow}>
                <Text style={styles.registerLead}>¿Aún no tienes cuenta?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.registerLink}>Crear cuenta</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer legal */}
            <Text style={styles.footer}>
              Al continuar aceptas los{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Terms')}>
                Términos
              </Text>{' '}
              y la{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Privacy')}>
                Privacidad
              </Text>
              .
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)', // mínimo — solo unifica negros
  },
  heroFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
  },

  // ============ Below hero ============
  below: {
    paddingHorizontal: s.xl,
    paddingTop: s.xl,
    paddingBottom: s['2xl'],
  },

  // ============ Headline (editorial centrado) ============
  headlineBlock: {
    alignItems: 'center',
    marginBottom: s.lg,
    paddingHorizontal: s.xs,
  },
  headline: {
    color: colors.text,
    fontSize: 28,
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    lineHeight: 36,
    textAlign: 'center',
  },
  headlineAccent: {
    color: colors.primary,
  },
  // Acento sutil bajo el headline — marca el cambio de sección sin línea dura
  headlineDivider: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: s['2xl'],
    opacity: 0.9,
  },

  // ============ Form ============
  form: {},
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: s.md + 2, // más respiro (18px)
  },
  fieldFocus: {
    borderBottomColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: fontWeight.medium,
    color: colors.text,
    paddingVertical: 0,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: s.sm,
    marginBottom: s.lg,
  },
  forgotText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
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
    marginTop: s.xs,
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

  // ============ Social (grandes, balance simétrico) ============
  socialRow: {
    flexDirection: 'row',
    gap: s.sm,
    marginTop: s.xl,
  },
  socialBtn: {
    flex: 1,
    height: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ Crear cuenta (fila centrada, propia) ============
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s.xs,
    marginTop: s.xl,
  },
  registerLead: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: fontWeight.medium,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ Footer legal ============
  footer: {
    color: colors.textFaint,
    textAlign: 'center',
    fontSize: 11,
    marginTop: s.xl,
    paddingHorizontal: s.lg,
    lineHeight: 16,
  },
  footerLink: {
    color: colors.textMuted,
    fontWeight: fontWeight.semibold,
  },
});
