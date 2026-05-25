// ==========================================
// DEVOLÓN — <NetworkError>
//
// Estado de "sin conexión" en dark mode premium. Reusa <Button> para
// el retry y theme tokens para todo lo demás.
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, s, radius, fontSize, fontWeight } from '../../theme';
import Button from './Button';

interface NetworkErrorProps {
  onRetry: () => void;
  message?: string;
}

export default function NetworkError({
  onRetry,
  message = 'No hay conexión a internet',
}: NetworkErrorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconHalo}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.primary} />
      </View>
      <Text style={styles.title}>Sin conexión</Text>
      <Text style={styles.subtitle}>{message}</Text>
      <Text style={styles.hint}>
        Verifica tu red e intenta de nuevo.
      </Text>
      <View style={styles.action}>
        <Button
          label="REINTENTAR"
          icon="refresh"
          iconPosition="left"
          onPress={onRetry}
          size="md"
          fullWidth={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s['2xl'],
  },
  iconHalo: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginTop: s.xs,
  },
  hint: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginTop: s.xs,
    lineHeight: 18,
  },
  action: {
    marginTop: s.xl,
  },
});
