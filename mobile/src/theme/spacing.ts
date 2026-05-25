// ==========================================
// DEVOLÓN — Spacing scale (base 4)
//
// Escala con nombres semánticos. Usar SIEMPRE estos tokens en padding,
// margin y gap; nunca números mágicos en estilos.
// ==========================================

export const spacing = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '10': 40,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
} as const;

/**
 * Aliases legibles para casos comunes. `s.md` lee mejor que `spacing['4']`.
 * Equivalencias: xxs=4, xs=8, sm=12, md=16, lg=20, xl=24, 2xl=32, 3xl=48.
 */
export const s = {
  xxs: spacing['1'],
  xs: spacing['2'],
  sm: spacing['3'],
  md: spacing['4'],
  lg: spacing['5'],
  xl: spacing['6'],
  '2xl': spacing['8'],
  '3xl': spacing['12'],
  '4xl': spacing['16'],
} as const;

export type SpacingToken = keyof typeof spacing;
