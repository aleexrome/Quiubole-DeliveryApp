import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { colors, spacing, borderRadius, typography } from '../../utils/theme';
import type { AuthStackScreenProps } from '../../navigation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }: AuthStackScreenProps<'Welcome'>) => {
  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Login');
  };

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Register');
  };

  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Logo and Title */}
        <Animated.View
          style={styles.headerSection}
          entering={FadeInDown.delay(200).duration(600)}
        >
          <Text style={styles.logo}>🛵</Text>
          <Text style={styles.title}>Quiúbole!</Text>
          <Text style={styles.subtitle}>
            Tu comida favorita, en minutos
          </Text>
        </Animated.View>

        {/* Illustration */}
        <Animated.View
          style={styles.illustrationSection}
          entering={FadeIn.delay(400).duration(800)}
        >
          <View style={styles.illustrationCircle}>
            <Text style={styles.illustrationEmoji}>🍔🍕🌮</Text>
          </View>
        </Animated.View>

        {/* Features */}
        <Animated.View
          style={styles.featuresSection}
          entering={FadeInUp.delay(600).duration(600)}
        >
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>⚡</Text>
            <Text style={styles.featureText}>Entrega rápida</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>🏪</Text>
            <Text style={styles.featureText}>+500 restaurantes</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureIcon}>💳</Text>
            <Text style={styles.featureText}>Pago seguro</Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={styles.buttonsSection}
          entering={FadeInUp.delay(800).duration(600)}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryButtonText}>Crear cuenta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleLogin}
            activeOpacity={0.9}
          >
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Terms */}
        <Animated.Text
          style={styles.terms}
          entering={FadeIn.delay(1000).duration(600)}
        >
          Al continuar, aceptas nuestros{' '}
          <Text style={styles.termsLink}>Términos de servicio</Text> y{' '}
          <Text style={styles.termsLink}>Política de privacidad</Text>
        </Animated.Text>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  headerSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logo: {
    fontSize: 60,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.textInverse,
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  illustrationSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationCircle: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    borderRadius: SCREEN_WIDTH * 0.3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationEmoji: {
    fontSize: 60,
  },
  featuresSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  featureText: {
    ...typography.small,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
  },
  buttonsSection: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.textInverse,
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.textInverse,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  terms: {
    ...typography.small,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
});

export default WelcomeScreen;
