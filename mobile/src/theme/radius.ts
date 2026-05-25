// ==========================================
// DEVOLÓN — Border radius scale
// ==========================================

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 14, // inputs y CTAs
  xl: 18,
  '2xl': 22, // cards
  '3xl': 28,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
