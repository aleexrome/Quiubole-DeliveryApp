// ==========================================
// NETWORK ERROR - ERROR DE CONEXION
// ==========================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#FF6B35',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  text: '#212529',
  warning: '#FFC107',
};

interface NetworkErrorProps {
  onRetry: () => void;
  message?: string;
}

export default function NetworkError({
  onRetry,
  message = 'No hay conexion a internet',
}: NetworkErrorProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="cloud-offline-outline" size={64} color={COLORS.warning} />
      </View>
      <Text style={styles.title}>Sin conexion</Text>
      <Text style={styles.subtitle}>{message}</Text>
      <Text style={styles.hint}>
        Verifica tu conexion a internet e intenta de nuevo
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Ionicons name="refresh" size={20} color={COLORS.white} />
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 32,
    gap: 8,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
