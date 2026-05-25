// ==========================================
// DEVOLÓN — Verify Email
//
// Inputs OTP de 6 dígitos en dark mode. Cada celda es un box glass que
// se ilumina amarillo al llenarse. Countdown sutil para reenvío.
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { Screen, Header, Button, Card } from '../../components/ui';
import { colors, s, radius, fontSize, fontWeight, tracking } from '../../theme';

export default function VerifyEmailScreen() {
  const { user, verifyEmail, resendVerificationCode, isLoading, logout } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);
      inputRefs.current[5]?.focus();
      return;
    }
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Código incompleto', 'Ingresa los 6 dígitos.');
      return;
    }
    const success = await verifyEmail(fullCode);
    if (success) Alert.alert('Verificado', 'Tu correo fue verificado correctamente.');
    else Alert.alert('Código inválido', 'Revisa el código o solicita uno nuevo.');
  };

  const handleResend = async () => {
    try {
      await resendVerificationCode();
      setCountdown(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      Alert.alert('Enviado', 'Te enviamos un nuevo código.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No pudimos reenviar el código.');
    }
  };

  return (
    <Screen>
      <Header title="" showBack={false} />
      <View style={styles.content}>
        <View style={styles.iconHalo}>
          <Ionicons name="mail-open-outline" size={48} color={colors.primary} />
        </View>

        <Text style={styles.eyebrow}>VERIFICACIÓN</Text>
        <Text style={styles.title}>Verifica tu correo</Text>
        <Text style={styles.subtitle}>Enviamos un código de 6 dígitos a</Text>
        <Text style={styles.email}>{user?.email}</Text>

        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectionColor={colors.primary}
              selectTextOnFocus
            />
          ))}
        </View>

        <View style={styles.actionWrap}>
          <Button
            label="VERIFICAR"
            icon="checkmark"
            iconPosition="right"
            onPress={handleVerify}
            loading={isLoading}
          />
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resendLead}>¿No recibiste el código?</Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.resendLink}>Reenviar</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdown}>Reenviar en {countdown}s</Text>
          )}
        </View>

        <Card variant="glass" padding={s.md} style={styles.spamCard}>
          <View style={styles.spamInner}>
            <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.spamText}>
              Si no lo ves, revisa tu carpeta de spam.
            </Text>
          </View>
        </Card>

        <TouchableOpacity onPress={logout} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.changeEmail}>Usar otro correo</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: s.lg,
    paddingTop: s.lg,
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
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xs,
  },
  email: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.4,
    marginTop: 2,
  },

  codeRow: {
    flexDirection: 'row',
    gap: s.xs + 2,
    marginTop: s['2xl'],
    marginBottom: s.xl,
  },
  codeInput: {
    width: 48,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    textAlign: 'center',
    color: colors.text,
  },
  codeInputFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,194,14,0.06)',
  },

  actionWrap: {
    width: '100%',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    marginTop: s.xl,
  },
  resendLead: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  resendLink: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  countdown: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  spamCard: {
    marginTop: s.xl,
    width: '100%',
  },
  spamInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  spamText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },

  changeEmail: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    marginTop: s.xl,
    textDecorationLine: 'underline',
  },
});
