// ==========================================
// DEVOLÓN — Sistema tipográfico
//
// System stack (Roboto Black en Android, SF Pro Display en iOS).
// Pesos heavy (800-900) reservados para títulos, eyebrows y CTAs.
// No introducir fuentes externas sin pasar por expo-font + load gating.
// ==========================================

import type { TextStyle } from 'react-native';

/**
 * Pesos como strings (TypeScript de RN exige string en `fontWeight`).
 * Android mapea: 900→roboto-black, 800→roboto-heavy, 700→roboto-bold.
 */
export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/** Escala tipográfica (px). */
export const fontSize = {
  xxs: 10,
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  '4xl': 36,
  hero: 54,
} as const;

/** Letter spacing presets. */
export const tracking = {
  tighter: -2.2, // hero wordmark
  tight: -0.4,
  normal: 0,
  wide: 0.5,
  wider: 1.6,
  widest: 2.5, // eyebrows / CTAs
  hyper: 2.8, // slogan
} as const;

/**
 * Composiciones reutilizables. Spread en tus styles:
 *   text: { ...textStyles.eyebrow, color: colors.primary }
 */
export const textStyles = {
  hero: {
    fontSize: fontSize.hero,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.tighter,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.tight,
  },
  subtitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  eyebrow: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase' as const,
  },
  slogan: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.hyper,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  bodyStrong: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  caption: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  cta: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase' as const,
  },
  legal: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
  },
} as const satisfies Record<string, TextStyle>;

export type TextStyleToken = keyof typeof textStyles;
