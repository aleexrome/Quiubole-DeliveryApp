// ==========================================
// DEVOLÓN — <Card>
//
// Contenedor con tratamiento "glass" del branding: superficie translúcida
// sobre negro + borde sutil. Reemplaza la mayoría de "View con bg blanco
// y sombra" legacy.
//
// Variantes:
//   glass   → rgba(255,255,255,0.04) + border 0.08 (default, premium feel)
//   raised  → bg graphite (#0A0A0A) + shadow sm (cuando hace falta peso)
//   flat    → solo border, sin fondo (listas, dividers)
// ==========================================

import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { colors, s, radius, shadows } from '../../theme';

type CardVariant = 'glass' | 'raised' | 'flat';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  /** Activa interacción (TouchableOpacity). */
  onPress?: () => void;
  /** Padding interior. Default: s.lg. Pasar 0 para layouts custom. */
  padding?: number;
  /** Radio. Default: radius['2xl'] (22). */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Card({
  children,
  variant = 'glass',
  onPress,
  padding = s.lg,
  borderRadius = radius['2xl'],
  style,
}: CardProps) {
  const variantStyles = getVariantStyles(variant);
  const Container: any = onPress ? TouchableOpacity : View;
  const containerProps = onPress ? { activeOpacity: 0.88, onPress } : {};

  return (
    <Container
      style={[styles.base, variantStyles, { padding, borderRadius }, style]}
      {...containerProps}
    >
      {children}
    </Container>
  );
}

function getVariantStyles(variant: CardVariant): ViewStyle {
  switch (variant) {
    case 'glass':
      return {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'raised':
      return {
        backgroundColor: colors.bgRaised,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
      };
    case 'flat':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
