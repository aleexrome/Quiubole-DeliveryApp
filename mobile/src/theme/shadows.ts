// ==========================================
// DEVOLÓN — Shadows / elevación
//
// iOS usa shadow*; Android usa elevation (sólo soporta sombra negra).
// El glow amarillo del CTA en Android se logra parcialmente con
// elevation; el efecto pleno se ve en iOS.
// ==========================================

import { Platform, type ViewStyle } from 'react-native';

const ios = (style: ViewStyle): ViewStyle => (Platform.OS === 'ios' ? style : {});
const android = (style: ViewStyle): ViewStyle => (Platform.OS === 'android' ? style : {});

export const shadows = {
  none: {} as ViewStyle,

  /** Sombra sutil para cards en reposo. */
  sm: {
    ...ios({
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    }),
    ...android({ elevation: 2 }),
  } as ViewStyle,

  /** Sombra media para modales / sheets. */
  md: {
    ...ios({
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
    }),
    ...android({ elevation: 4 }),
  } as ViewStyle,

  /** Sombra alta para overlays flotantes. */
  lg: {
    ...ios({
      shadowColor: '#000',
      shadowOpacity: 0.45,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
    }),
    ...android({ elevation: 8 }),
  } as ViewStyle,

  /** Glow amarillo — reservado para CTA primario. */
  glow: {
    ...ios({
      shadowColor: '#FFC20E',
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
    }),
    ...android({ elevation: 8 }),
  } as ViewStyle,
} as const;

export type ShadowToken = keyof typeof shadows;
