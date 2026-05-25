// ==========================================
// DEVOLÓN — Logo oficial
//
// Renderiza el sticker `devolon-logo-source.png` (autoridad de marca).
// El archivo trae el wordmark + pin + ribbon "MÁS RÁPIDO, IMPOSIBLE."
// integrados, por lo tanto NO acompañar este componente con un slogan
// adicional en la misma pantalla — sería redundante.
//
// Tamaño:
//   `size` = ALTURA en px. El ancho se calcula con el aspect ratio nativo
//   del sticker (1536/1024 = 1.5).
//
// Color:
//   prop `tint` opcional: aplica tintColor monocromático (cuando necesites
//   versión sólida amarilla o negra). Por defecto = renderizado a color.
// ==========================================

import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

const ASPECT = 1536 / 1024; // ancho/alto del sticker

type Props = {
  /** Altura en px. Default 96. */
  size?: number;
  /** Tinta monocromática opcional (por ejemplo `colors.primary`). */
  tint?: string;
  style?: StyleProp<ImageStyle>;
};

export default function DevolonLogo({ size = 96, tint, style }: Props) {
  return (
    <Image
      source={require('../../assets/brand/devolon-logo-source.png')}
      style={[
        { width: size * ASPECT, height: size },
        tint ? { tintColor: tint } : null,
        style,
      ]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="Devolón"
    />
  );
}
