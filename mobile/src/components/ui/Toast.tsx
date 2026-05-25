// ==========================================
// DEVOLÓN — <Toast>
//
// Toast premium: superficie glass + acento por tipo. Mantiene el feel
// dark-mode minimalista del branding.
//   success → verde semántico
//   error   → rojo
//   warning → amarillo brand (mensaje importante)
//   info    → azul info
// ==========================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, s, radius, fontSize, fontWeight, shadows } from '../../theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  type: ToastType;
  message: string;
  duration?: number;
  onHide: () => void;
}

const TOAST_ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  warning: 'warning',
  info: 'information-circle',
};

const TOAST_ACCENT: Record<ToastType, string> = {
  success: colors.success,
  error: colors.danger,
  warning: colors.primary,
  info: colors.info,
};

export default function Toast({
  visible,
  type,
  message,
  duration = 3000,
  onHide,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => hideToast(), duration);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -100, duration: 240, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const accent = TOAST_ACCENT[type];

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity, borderColor: accent },
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <Ionicons name={TOAST_ICONS[type]} size={22} color={accent} />
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <TouchableOpacity
          onPress={hideToast}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: colors.bgRaised,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.lg,
    zIndex: 9999,
  },
  accentBar: {
    width: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: s.md,
    gap: s.sm,
  },
  message: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  closeButton: {
    padding: 4,
  },
});
