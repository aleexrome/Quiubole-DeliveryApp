// ==========================================
// DEVOLÓN — Paleta y tokens semánticos de color
//
// Regla estricta: amarillo Pantone 123 C (#FFC20E) es el ÚNICO color
// de acento. Negro + blanco hacen todo el resto del trabajo.
// No introducir colores ad-hoc en pantallas; si hace falta un nuevo
// matiz, agregarlo aquí primero.
// ==========================================

/**
 * Palette: valores primitivos. No usar directo en componentes excepto
 * para casos puntuales (ej. shadow color). Preferir `colors.*` semánticos.
 */
export const palette = {
  black: '#000000',
  graphite: '#0A0A0A', // fondo elevado
  ink: '#0E0E0E', // inputs / contenedores
  charcoal: '#141414', // un paso más arriba
  yellow: '#FFC20E', // Pantone 123 C — brand primary
  yellowDeep: '#E0A800', // hover/pressed amarillo
  white: '#FFFFFF',
} as const;

/**
 * Colores semánticos. SIEMPRE consume desde aquí en componentes.
 * Cambiar un valor aquí actualiza toda la app.
 */
export const colors = {
  // Backgrounds
  bg: palette.black,
  bgRaised: palette.graphite,
  surface: 'rgba(255,255,255,0.04)', // glass card
  surfaceStrong: 'rgba(255,255,255,0.08)',
  inputBg: palette.ink,

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  borderFocus: palette.yellow,

  // Brand / interactive
  primary: palette.yellow,
  primaryPressed: palette.yellowDeep,
  primaryGlow: 'rgba(255,194,14,0.35)',
  onPrimary: palette.black, // texto sobre amarillo

  // Text
  text: palette.white,
  textMuted: 'rgba(255,255,255,0.55)',
  textFaint: 'rgba(255,255,255,0.35)',
  textOnYellow: palette.black,

  // Estado / semánticos. Mantener al mínimo y deuda visual baja.
  success: '#1FAE6F',
  warning: palette.yellow, // unificado con brand: warning ≈ algo importante
  danger: '#E5484D',
  info: '#2E90FA',

  // Overlays
  overlay: 'rgba(0,0,0,0.6)',
  overlayLight: 'rgba(0,0,0,0.3)',
} as const;

export type ColorToken = keyof typeof colors;
