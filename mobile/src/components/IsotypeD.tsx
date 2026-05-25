// ==========================================
// DEVOLÓN — Isotipo "D"
//
// Renderiza la silueta extraída de `devolon-isotype.png` con `tintColor`,
// permitiendo cambiar el color sin re-procesar el asset.
//
// Reglas de uso:
//   - Hero: <IsotypeD size={300} />                  (yellow default)
//   - Mark sutil: <IsotypeD size={28} tint={colors.textFaint} />
//   - Tipo "ghost": <IsotypeD size={300} tint={colors.text} style={{opacity: 0.05}} />
//
// El isotipo fue extraído del icon oficial (NO redibujado). Aspect ~1.42.
// ==========================================

import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { colors } from '../theme';

const ASPECT = 866 / 608; // ancho / alto del PNG trimmed

type Props = {
  /** Altura en px. Default 200. */
  size?: number;
  /** Color (tintColor). Default `colors.primary`. */
  tint?: string;
  style?: StyleProp<ImageStyle>;
};

export default function IsotypeD({ size = 200, tint = colors.primary, style }: Props) {
  return (
    <Image
      source={require('../../assets/brand/devolon-isotype.png')}
      style={[{ width: size * ASPECT, height: size, tintColor: tint }, style]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Devolón"
    />
  );
}
