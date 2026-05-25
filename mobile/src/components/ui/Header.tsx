// ==========================================
// DEVOLÓN — <Header>
//
// Header inline reutilizable para sub-pantallas que NO usan el header
// nativo del stack. Variantes:
//
//   solid       → bg negro absoluto (default, para pantallas estándar)
//   transparent → sobre hero/imagen (no pinta fondo, solo iconos)
//
// Espera estar dentro de un <Screen> o equivalente con safeArea ya
// resuelto. Si la pantalla tiene scroll, usar este Header FUERA del
// ScrollView para que quede pegado arriba.
// ==========================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, s, fontWeight, fontSize, tracking } from '../../theme';

type HeaderVariant = 'solid' | 'transparent';

interface HeaderProps {
  title?: string;
  /** Subtítulo eyebrow encima del title — minúsculas + letter-spacing. */
  eyebrow?: string;
  variant?: HeaderVariant;
  /** Mostrar back button. Default: true si hay history. */
  showBack?: boolean;
  onBackPress?: () => void;
  /** Acción derecha (icono o nodo custom). */
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightContent?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function Header({
  title,
  eyebrow,
  variant = 'solid',
  showBack = true,
  onBackPress,
  rightIcon,
  onRightPress,
  rightContent,
  style,
}: HeaderProps) {
  const navigation = useNavigation<any>();
  const isTransparent = variant === 'transparent';

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <View
      style={[
        styles.container,
        !isTransparent && styles.solid,
        style,
      ]}
    >
      <View style={styles.side}>
        {showBack && (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.iconBtn}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        {title && (
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        )}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {rightContent ??
          (rightIcon && (
            <TouchableOpacity
              onPress={onRightPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.iconBtn}
            >
              <Ionicons name={rightIcon} size={22} color={colors.text} />
            </TouchableOpacity>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: s.md,
  },
  solid: {
    backgroundColor: colors.bg,
  },
  side: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
  },
});
