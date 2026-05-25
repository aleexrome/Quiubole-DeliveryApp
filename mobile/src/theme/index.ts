// ==========================================
// DEVOLÓN — Theme entrypoint
//
// Uso recomendado en componentes:
//
//   import { theme } from '@/theme';
//   ...
//   backgroundColor: theme.colors.bg,
//   padding: theme.s.md,
//   borderRadius: theme.radius.lg,
//   ...theme.textStyles.title,
//   ...theme.shadows.glow,
//
// O importar tokens individuales:
//
//   import { colors, s, radius } from '@/theme';
// ==========================================

import { colors, palette } from './colors';
import { spacing, s } from './spacing';
import { radius } from './radius';
import {
  fontSize,
  fontWeight,
  tracking,
  textStyles,
} from './typography';
import { shadows } from './shadows';

export * from './colors';
export * from './spacing';
export * from './radius';
export * from './typography';
export * from './shadows';

export const theme = {
  colors,
  palette,
  spacing,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
  textStyles,
  shadows,
} as const;

export type Theme = typeof theme;
