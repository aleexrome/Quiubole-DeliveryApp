// ==========================================
// DEVOLÓN — Forgot Password
//
// Estado dual: form inicial + confirmación con halo amarillo.
// Sin fondos claros, sin colores legacy. Todo via theme + primitivos.
// ==========================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { Screen, Header, Input, Button } from '../../components/ui';
import { colors, s, radius, fontSize, fontWeight, tracking } from '../../theme';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { forgotPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) {
      Alert.alert('Faltan datos', 'Ingresa tu correo electrónico');
      return;
    }
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No pudimos enviar el correo');
    }
  };

  if (sent) {
    return (
      <Screen>
        <Header title="" showBack={false} />
        <View style={styles.content}>
          <View style={[styles.iconHalo, styles.iconHaloSuccess]}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success} />
          </View>
          <Text style={styles.eyebrow}>CORREO ENVIADO</Text>
          <Text style={styles.title}>Revisa tu bandeja</Text>
          <Text style={styles.subtitle}>
            Mandamos instrucciones para restablecer tu contraseña a
          </Text>
          <Text style={styles.emailMono}>{email}</Text>
          <View style={styles.actionWrap}>
            <Button
              label="VOLVER AL LOGIN"
              icon="arrow-back"
              iconPosition="left"
              onPress={() => navigation.navigate('Login')}
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="" />
      <View style={styles.content}>
        <View style={styles.iconHalo}>
          <Ionicons name="key-outline" size={48} color={colors.primary} />
        </View>

        <Text style={styles.eyebrow}>RECUPERAR ACCESO</Text>
        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo y te enviaremos instrucciones para restablecerla.
        </Text>

        <View style={styles.formWrap}>
          <Input
            variant="underline"
            icon="mail-outline"
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.actionWrap}>
          <Button
            label="ENVIAR INSTRUCCIONES"
            onPress={handleSend}
            loading={isLoading}
          />
        </View>

        <View style={styles.backRow}>
          <Ionicons name="arrow-back" size={14} color={colors.primary} />
          <Text style={styles.backLink} onPress={() => navigation.navigate('Login')}>
            Volver al login
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s.lg,
    paddingBottom: s['3xl'],
  },
  iconHalo: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.xl,
  },
  iconHaloSuccess: {
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderColor: 'rgba(31,174,111,0.4)',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
    marginBottom: s.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    textAlign: 'center',
    marginBottom: s.sm,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: s.md,
  },
  emailMono: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    marginTop: s.xs,
  },
  formWrap: {
    width: '100%',
    marginTop: s['2xl'],
  },
  actionWrap: {
    width: '100%',
    marginTop: s['2xl'],
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    marginTop: s.xl,
  },
  backLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
});
