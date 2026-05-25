// ==========================================
// DEVOLÓN — Radar Hero del Driver
//
// Hero visual estilo "radar de pedidos" para la pantalla Driver Home.
// NO usa Google Maps (que requiere API key y rebuild nativo). En su
// lugar pinta un canvas dark con grid + dot central pulsante = driver,
// + anillos concéntricos amarillos. Pins aledaños representan pedidos
// cercanos cuando los hay.
//
// Cuando se integre `react-native-maps` con API key real, este
// componente se reemplaza por el MapView manteniendo la misma interfaz.
// ==========================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, s, radius, fontSize, fontWeight, tracking } from '../../theme';

interface RadarHeroProps {
  online: boolean;
  /** Cuántos pedidos hay en zona — modula la cantidad de pins visibles. */
  ordersNearby?: number;
  /** Texto eyebrow opcional. */
  eyebrow?: string;
  /** Modo fullscreen — sin border-radius ni borde, llena el parent. */
  fullscreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

const PIN_POSITIONS = [
  { x: 0.18, y: 0.22 },
  { x: 0.78, y: 0.35 },
  { x: 0.62, y: 0.78 },
  { x: 0.22, y: 0.7 },
  { x: 0.85, y: 0.65 },
];

export default function RadarHero({
  online,
  ordersNearby = 0,
  eyebrow,
  fullscreen = false,
  style,
}: RadarHeroProps) {
  // Anillo pulsante (escala 1 → 1.6, opacidad 1 → 0) en loop.
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!online) {
      pulse1.setValue(0);
      pulse2.setValue(0);
      return;
    }
    const make = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    const a = make(pulse1, 0);
    const b = make(pulse2, 1200);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [online, pulse1, pulse2]);

  const ring1Scale = pulse1.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] });
  const ring1Opacity = pulse1.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.35, 0] });
  const ring2Scale = pulse2.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] });
  const ring2Opacity = pulse2.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.35, 0] });

  const visiblePins = Math.min(ordersNearby, PIN_POSITIONS.length);

  return (
    <View
      style={[
        styles.container,
        fullscreen && styles.containerFull,
        !online && styles.containerOffline,
        style,
      ]}
    >
      {/* Grid lines decorativas */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {[0.25, 0.5, 0.75].map((p) => (
          <View
            key={`h-${p}`}
            style={[styles.gridLineH, { top: `${p * 100}%` }]}
          />
        ))}
        {[0.25, 0.5, 0.75].map((p) => (
          <View
            key={`v-${p}`}
            style={[styles.gridLineV, { left: `${p * 100}%` }]}
          />
        ))}
      </View>

      {/* Pedidos cercanos = pins distribuidos */}
      {online &&
        Array.from({ length: visiblePins }).map((_, i) => {
          const pos = PIN_POSITIONS[i];
          return (
            <View
              key={i}
              style={[
                styles.pin,
                { left: `${pos.x * 100}%`, top: `${pos.y * 100}%` },
              ]}
            >
              <View style={styles.pinHalo}>
                <Ionicons name="restaurant" size={12} color={colors.primary} />
              </View>
            </View>
          );
        })}

      {/* Anillos pulsantes (solo online) */}
      {online && (
        <>
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ring1Opacity,
                transform: [{ scale: ring1Scale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              {
                opacity: ring2Opacity,
                transform: [{ scale: ring2Scale }],
              },
            ]}
          />
        </>
      )}

      {/* Dot central = posición del driver */}
      <View style={[styles.driverDot, !online && styles.driverDotOffline]}>
        <View style={[styles.driverDotInner, !online && styles.driverDotInnerOffline]} />
      </View>

      {/* Eyebrow opcional arriba a la izquierda */}
      {eyebrow && (
        <View style={styles.eyebrowWrap}>
          <View
            style={[
              styles.eyebrowDot,
              !online && styles.eyebrowDotOffline,
            ]}
          />
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
      )}

      {/* Contador de pedidos cercanos */}
      {online && (
        <View style={styles.counterWrap}>
          <Text style={styles.counterValue}>{ordersNearby}</Text>
          <Text style={styles.counterLabel}>
            PEDIDO{ordersNearby === 1 ? '' : 'S'} CERCA
          </Text>
        </View>
      )}
    </View>
  );
}

const RADAR_HEIGHT = 220;
const DOT_SIZE = 18;

const styles = StyleSheet.create({
  container: {
    height: RADAR_HEIGHT,
    backgroundColor: colors.bgRaised,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  // En modo fullscreen el radar es el fondo completo de la pantalla:
  // sin border, sin radius, height auto (flex:1 desde el parent).
  containerFull: {
    height: undefined,
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: colors.bg,
  },
  containerOffline: {
    opacity: 0.55,
  },

  // ============ GRID ============
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
    opacity: 0.45,
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.border,
    opacity: 0.45,
  },

  // ============ ANILLOS PULSANTES ============
  ring: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: colors.primary,
    marginLeft: -45,
    marginTop: -45,
  },

  // ============ DOT CENTRAL (driver) ============
  driverDot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: DOT_SIZE,
    height: DOT_SIZE,
    marginLeft: -DOT_SIZE / 2,
    marginTop: -DOT_SIZE / 2,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    // glow
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  driverDotOffline: {
    backgroundColor: colors.textMuted,
    shadowOpacity: 0,
    elevation: 0,
  },
  driverDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg,
  },
  driverDotInnerOffline: { backgroundColor: colors.bgRaised },

  // ============ PINS ============
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinHalo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,194,14,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ EYEBROW ============
  eyebrowWrap: {
    position: 'absolute',
    top: s.md,
    left: s.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  eyebrowDotOffline: { backgroundColor: colors.textMuted },
  eyebrowText: {
    color: colors.text,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },

  // ============ COUNTER (orders nearby) ============
  counterWrap: {
    position: 'absolute',
    bottom: s.md,
    right: s.md,
    alignItems: 'flex-end',
    paddingHorizontal: s.sm,
    paddingVertical: s.xs,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterValue: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  counterLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
});
