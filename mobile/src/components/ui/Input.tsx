// ==========================================
// DEVOLÓN — <Input>
//
// Dos variantes que cubren el 100% de los casos:
//
//   underline → minimalista (estilo LoginScreen). Sin borde lateral, sin
//               fondo. Ideal para flows premium (auth, checkout, perfil).
//   filled    → input box completo con bg + border. Para forms densos
//               (admin, restaurant edit, editor).
//
// Focus state SIEMPRE pinta el acento amarillo (borde + ícono).
// ==========================================

import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, s, radius, fontSize, fontWeight, textStyles } from '../../theme';

type InputVariant = 'underline' | 'filled';

interface InputProps extends Omit<TextInputProps, 'style'> {
  variant?: InputVariant;
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  /** Toggle visual de secureTextEntry con ojo. */
  secure?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    variant = 'filled',
    label,
    icon,
    rightIcon,
    onRightIconPress,
    error,
    containerStyle,
    secure = false,
    secureTextEntry,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isSecure = secure || secureTextEntry;
  const showSecureToggle = secure;

  const fieldStyle =
    variant === 'underline' ? styles.underline : styles.filled;

  const focusStyle =
    variant === 'underline' ? styles.underlineFocus : styles.filledFocus;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={[fieldStyle, focused && focusStyle, !!error && styles.error]}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textFaint}
            style={styles.iconLeft}
          />
        )}

        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={colors.textFaint}
          selectionColor={colors.primary}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          secureTextEntry={isSecure && !revealed}
          {...props}
        />

        {showSecureToggle && (
          <TouchableOpacity
            onPress={() => setRevealed((p) => !p)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={revealed ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}

        {rightIcon && !showSecureToggle && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={rightIcon} size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

export default Input;

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  label: {
    ...textStyles.eyebrow,
    color: colors.textMuted,
    marginBottom: s.xs,
  },

  // ============ UNDERLINE (login-style) ============
  underline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: s.md + 2,
  },
  underlineFocus: { borderBottomColor: colors.primary },

  // ============ FILLED (forms densos) ============
  filled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: s.md,
    height: 52,
  },
  filledFocus: { borderColor: colors.primary },

  error: { borderColor: colors.danger },

  iconLeft: {},
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    paddingVertical: 0,
  },
  errorText: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: s.xs,
  },
});
