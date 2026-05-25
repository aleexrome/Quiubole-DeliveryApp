// ==========================================
// DEVOLÓN — <Button>
//
// CTA premium con variantes. El glow amarillo es la firma visual del
// botón primario — reservar SOLO para la acción principal de la pantalla.
//
// Variantes:
//   primary   → bg amarillo + glow (acción principal)
//   secondary → bg surface + borde (acción secundaria)
//   ghost     → transparente + texto primary (acción terciaria)
//   danger    → bg rojo (eliminar, salir, etc.)
//
// Tamaños: sm (40), md (48), lg (56 — igual al CTA de Login).
// ==========================================

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, s, radius, shadows, textStyles, fontWeight } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const SIZE_MAP: Record<Size, { height: number; fontSize: number; iconSize: number; px: number }> = {
  sm: { height: 40, fontSize: 12, iconSize: 16, px: s.md },
  md: { height: 48, fontSize: 13, iconSize: 18, px: s.lg },
  lg: { height: 56, fontSize: 14, iconSize: 18, px: s.xl },
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  labelStyle,
}: ButtonProps) {
  const sizing = SIZE_MAP[size];
  const isDisabled = disabled || loading;

  const variantStyles = getVariantStyles(variant);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.base,
        {
          height: sizing.height,
          paddingHorizontal: sizing.px,
          width: fullWidth ? '100%' : undefined,
        },
        variantStyles.container,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.label.color as string} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={sizing.iconSize}
              color={variantStyles.label.color as string}
              style={{ marginRight: s.xs }}
            />
          )}
          <Text
            style={[
              textStyles.cta,
              { fontSize: sizing.fontSize },
              variantStyles.label,
              labelStyle,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={sizing.iconSize}
              color={variantStyles.label.color as string}
              style={{ marginLeft: s.xs }}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function getVariantStyles(variant: Variant): { container: ViewStyle; label: TextStyle } {
  switch (variant) {
    case 'primary':
      return {
        container: { backgroundColor: colors.primary, ...shadows.glow },
        label: { color: colors.onPrimary, fontWeight: fontWeight.black },
      };
    case 'secondary':
      return {
        container: {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderStrong,
        },
        label: { color: colors.text, fontWeight: fontWeight.heavy },
      };
    case 'ghost':
      return {
        container: { backgroundColor: 'transparent' },
        label: { color: colors.primary, fontWeight: fontWeight.heavy },
      };
    case 'danger':
      return {
        container: { backgroundColor: colors.danger },
        label: { color: colors.text, fontWeight: fontWeight.black },
      };
  }
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disabled: { opacity: 0.45 },
});
