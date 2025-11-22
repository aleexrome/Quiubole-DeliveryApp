// ==========================================
// LOADING SCREEN - PANTALLA DE CARGA
// ==========================================

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';

const COLORS = {
  primary: '#FF6B35',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  text: '#212529',
};

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = 'Cargando...',
  fullScreen = true,
}: LoadingScreenProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  if (!fullScreen) {
    return (
      <View style={styles.inline}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        {message && <Text style={styles.inlineText}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.logo}>Q!</Text>
      </Animated.View>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.white,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: COLORS.gray,
  },
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  inlineText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
});
