// ==========================================
// DEVOLÓN — <Section>
//
// Bloque de sección con eyebrow + título + acción derecha opcional.
// Reemplaza el patrón "<Text> Título <Text> y luego contenido" legacy.
//
// Usa eyebrow uppercase amarillo opcional para acentos premium tipo
// editorial. Mantén el eyebrow corto (≤ 3 palabras).
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
import { colors, s, fontSize, fontWeight, tracking } from '../../theme';

interface SectionProps {
  children?: React.ReactNode;
  title?: string;
  eyebrow?: string;
  /** Acción derecha (texto tipo "Ver todo"). */
  actionLabel?: string;
  onActionPress?: () => void;
  /** Espacio inferior. Default: s['2xl']. */
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}

export default function Section({
  children,
  title,
  eyebrow,
  actionLabel,
  onActionPress,
  spacing = s['2xl'],
  style,
}: SectionProps) {
  const hasHeader = title || eyebrow || actionLabel;

  return (
    <View style={[{ marginBottom: spacing }, style]}>
      {hasHeader && (
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
            {title && <Text style={styles.title}>{title}</Text>}
          </View>

          {actionLabel && onActionPress && (
            <TouchableOpacity
              onPress={onActionPress}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.action}>{actionLabel}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: s.md,
  },
  titleBlock: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.4,
  },
  action: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
});
