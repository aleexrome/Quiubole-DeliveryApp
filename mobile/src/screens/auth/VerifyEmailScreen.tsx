// ==========================================
// PANTALLA DE VERIFICACION DE EMAIL
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function VerifyEmailScreen() {
  const { user, verifyEmail, resendVerificationCode, isLoading, logout } = useAuthStore();

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Manejar cambio en inputs de codigo
  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // Si pegan un codigo completo
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

    // Auto-focus siguiente input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Manejar backspace
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verificar codigo
  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('Error', 'Ingresa el codigo completo de 6 digitos');
      return;
    }

    const success = await verifyEmail(fullCode);
    if (success) {
      Alert.alert('Exito', 'Tu email ha sido verificado');
    } else {
      Alert.alert('Error', 'Codigo invalido o expirado');
    }
  };

  // Reenviar codigo
  const handleResend = async () => {
    try {
      await resendVerificationCode();
      setCountdown(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      Alert.alert('Enviado', 'Hemos enviado un nuevo codigo a tu email');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo reenviar el codigo');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="mail-open" size={64} color="#FF6B35" />
        </View>

        {/* Title */}
        <Text style={styles.title}>Verifica tu Email</Text>
        <Text style={styles.subtitle}>
          Enviamos un codigo de 6 digitos a{'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Text>

        {/* Code Input */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputRefs.current[index] = ref)}
              style={[styles.codeInput, digit && styles.codeInputFilled]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verificar</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>¿No recibiste el codigo? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Reenviar</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.countdown}>Reenviar en {countdown}s</Text>
          )}
        </View>

        {/* Check spam */}
        <View style={styles.spamContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.spamText}>
            Si no lo ves, revisa tu carpeta de spam o correo no deseado
          </Text>
        </View>

        {/* Change email */}
        <TouchableOpacity style={styles.changeEmail} onPress={logout}>
          <Text style={styles.changeEmailText}>Usar otro correo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  email: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0F172A',
  },
  codeInputFilled: {
    backgroundColor: '#FFF5F0',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 64,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  resendText: {
    color: '#666',
    fontSize: 14,
  },
  resendLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  countdown: {
    color: '#999',
    fontSize: 14,
  },
  spamContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginTop: 32,
  },
  spamText: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  changeEmail: {
    marginTop: 24,
  },
  changeEmailText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});
