// ==========================================
// DEVOLÓN — SurpriseMeScreen
//
// Tres fases: preferencias (chips + budget cards), ruleta giratoria
// (disco amarillo con glow) y resultado (card glass + confetti). Mantiene
// las mismas animaciones; sólo cambia el lenguaje visual a dark + brand.
// ==========================================

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const MOCK_RESTAURANTS = [
  { id: '1', name: 'Tacos El Primo', category: 'Mexicana', rating: 4.8, deliveryTime: '25-35', image: '🌮' },
  { id: '2', name: 'Sushi Kyoto', category: 'Japonesa', rating: 4.6, deliveryTime: '30-40', image: '🍣' },
  { id: '3', name: 'Pizza Napoli', category: 'Italiana', rating: 4.5, deliveryTime: '25-35', image: '🍕' },
  { id: '4', name: 'Burger House', category: 'Americana', rating: 4.4, deliveryTime: '20-30', image: '🍔' },
  { id: '5', name: 'Wok Express', category: 'China', rating: 4.3, deliveryTime: '25-35', image: '🥡' },
  { id: '6', name: 'El Asador', category: 'Argentina', rating: 4.7, deliveryTime: '35-45', image: '🥩' },
  { id: '7', name: 'Mariscos del Pacífico', category: 'Mariscos', rating: 4.5, deliveryTime: '30-40', image: '🦐' },
  { id: '8', name: 'Veggie Garden', category: 'Vegetariana', rating: 4.4, deliveryTime: '20-30', image: '🥗' },
];

const PREFERENCES = [
  { id: 'any', label: 'Cualquier cosa', icon: '🎲' },
  { id: 'mexican', label: 'Mexicana', icon: '🌮' },
  { id: 'asian', label: 'Asiática', icon: '🍜' },
  { id: 'fast', label: 'Rápida', icon: '🍔' },
  { id: 'healthy', label: 'Saludable', icon: '🥗' },
  { id: 'premium', label: 'Premium', icon: '⭐' },
];

const BUDGET_OPTIONS = [
  { id: 'any', label: 'Sin límite', range: '$$$' },
  { id: 'low', label: 'Económico', range: '$50-100' },
  { id: 'medium', label: 'Moderado', range: '$100-200' },
  { id: 'high', label: 'Sin restricciones', range: '$200+' },
];

export default function SurpriseMeScreen() {
  const navigation = useNavigation<any>();
  const [step, setStep] = useState<'preferences' | 'spinning' | 'result'>('preferences');
  const [selectedPreference, setSelectedPreference] = useState('any');
  const [selectedBudget, setSelectedBudget] = useState('any');
  const [result, setResult] = useState<typeof MOCK_RESTAURANTS[0] | null>(null);

  const spinAnimation = useRef(new Animated.Value(0)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const resultOpacity = useRef(new Animated.Value(0)).current;
  const confettiAnimations = useRef(
    Array(12).fill(0).map(() => ({
      y: new Animated.Value(0),
      x: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  const handleSpin = () => {
    setStep('spinning');

    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.9,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(spinAnimation, {
          toValue: 10,
          duration: 2500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnimation, {
          toValue: 1.1,
          duration: 2500,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      const randomIndex = Math.floor(Math.random() * MOCK_RESTAURANTS.length);
      setResult(MOCK_RESTAURANTS[randomIndex]);
      setStep('result');

      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(resultOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      confettiAnimations.forEach((anim) => {
        const randomX = (Math.random() - 0.5) * 300;
        const randomDelay = Math.random() * 200;

        Animated.sequence([
          Animated.delay(randomDelay),
          Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(anim.y, {
              toValue: 400,
              duration: 1500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, { toValue: randomX, duration: 1500, useNativeDriver: true }),
          ]),
          Animated.timing(anim.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start();
      });
    });
  };

  const handleReset = () => {
    spinAnimation.setValue(0);
    resultOpacity.setValue(0);
    scaleAnimation.setValue(1);
    confettiAnimations.forEach((anim) => {
      anim.y.setValue(0);
      anim.x.setValue(0);
      anim.opacity.setValue(0);
    });
    setStep('preferences');
    setResult(null);
  };

  const spin = spinAnimation.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '3600deg'],
  });

  const renderPreferences = () => (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.preferencesContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroBlock}>
        <Text style={styles.heroEyebrow}>SORPRÉNDEME</Text>
        <Text style={styles.heroTitle}>
          ¿Qué tipo de antojo{'\n'}tienes hoy?
        </Text>
        <Text style={styles.heroSubtitle}>
          Selecciona tus preferencias y te encontramos algo nuevo.
        </Text>
      </View>

      <Text style={styles.sectionEyebrow}>ESTILO</Text>
      <View style={styles.optionsGrid}>
        {PREFERENCES.map((pref) => {
          const active = selectedPreference === pref.id;
          return (
            <TouchableOpacity
              key={pref.id}
              activeOpacity={0.85}
              style={[styles.optionCard, active && styles.optionCardActive]}
              onPress={() => setSelectedPreference(pref.id)}
            >
              <Text style={styles.optionEmoji}>{pref.icon}</Text>
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                {pref.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionEyebrow}>PRESUPUESTO</Text>
      <View style={styles.budgetList}>
        {BUDGET_OPTIONS.map((budget) => {
          const active = selectedBudget === budget.id;
          return (
            <TouchableOpacity
              key={budget.id}
              activeOpacity={0.85}
              style={[styles.budgetOption, active && styles.budgetOptionActive]}
              onPress={() => setSelectedBudget(budget.id)}
            >
              <View>
                <Text style={[styles.budgetLabel, active && styles.budgetLabelActive]}>
                  {budget.label}
                </Text>
                <Text style={styles.budgetRange}>{budget.range}</Text>
              </View>
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={active ? colors.primary : colors.textFaint}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity activeOpacity={0.88} style={styles.spinCta} onPress={handleSpin}>
        <Ionicons name="shuffle" size={20} color={colors.onPrimary} />
        <Text style={styles.spinCtaText}>SORPRÉNDEME</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderSpinning = () => (
    <View style={styles.spinningContainer}>
      <View style={styles.spinHalo}>
        <Animated.View
          style={[
            styles.spinWheel,
            { transform: [{ rotate: spin }, { scale: scaleAnimation }] },
          ]}
        >
          <Text style={styles.spinWheelEmoji}>🎰</Text>
        </Animated.View>
      </View>
      <Text style={styles.spinningEyebrow}>BUSCANDO</Text>
      <Text style={styles.spinningTitle}>Tu sorpresa{'\n'}está en camino…</Text>
    </View>
  );

  const renderResult = () => (
    <Animated.View style={[styles.resultContainer, { opacity: resultOpacity }]}>
      {confettiAnimations.map((anim, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.confetti,
            {
              transform: [{ translateY: anim.y }, { translateX: anim.x }],
              opacity: anim.opacity,
              left: `${50 + (index - 6) * 5}%`,
            },
          ]}
        >
          {['✨', '⭐', '🎉', '🎊'][index % 4]}
        </Animated.Text>
      ))}

      <Text style={styles.resultEyebrow}>TU SORPRESA</Text>

      <View style={styles.resultCard}>
        <View style={styles.resultImageContainer}>
          <Text style={styles.resultEmoji}>{result?.image}</Text>
        </View>
        <Text style={styles.resultName}>{result?.name}</Text>
        <Text style={styles.resultCategory}>{result?.category?.toUpperCase()}</Text>

        <View style={styles.resultMeta}>
          <View style={styles.resultMetaItem}>
            <Ionicons name="star" size={14} color={colors.primary} />
            <Text style={styles.resultMetaText}>{result?.rating}</Text>
          </View>
          <View style={styles.resultMetaDot} />
          <View style={styles.resultMetaItem}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.resultMetaText}>{result?.deliveryTime} min</Text>
          </View>
        </View>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity
          activeOpacity={0.88}
          style={styles.acceptButton}
          onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: result?.id })}
        >
          <Text style={styles.acceptButtonText}>VER MENÚ</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.rerollButton}
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text style={styles.rerollButtonText}>OTRA VEZ</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.quickOrderButton}
        onPress={() => {
          Alert.alert(
            'Pedido sorpresa',
            'Ordenaremos algo delicioso para ti basado en los más pedidos de este restaurante. ¿Estás listo?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Sorpréndeme',
                onPress: () =>
                  navigation.navigate('Checkout', {
                    surpriseOrder: true,
                    restaurantId: result?.id,
                  }),
              },
            ],
          );
        }}
      >
        <Ionicons name="flash" size={18} color={colors.primary} />
        <Text style={styles.quickOrderText}>Pedido sorpresa completo</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Header title="Sorpréndeme" eyebrow="DEVOLÓN" />

      {step === 'preferences' && renderPreferences()}
      {step === 'spinning' && renderSpinning()}
      {step === 'result' && renderResult()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  // ============ PREFERENCES ============
  preferencesContent: {
    paddingHorizontal: s.xl,
    paddingTop: s.md,
    paddingBottom: s['3xl'],
  },
  heroBlock: {
    marginBottom: s.xl,
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  heroTitle: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.8,
    lineHeight: 34,
    marginTop: s.xs,
  },
  heroSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginTop: s.xs,
    lineHeight: 20,
  },
  sectionEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.sm,
  },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
    marginBottom: s.xl,
  },
  optionCard: {
    width: '31.5%',
    paddingVertical: s.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  optionCardActive: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  optionEmoji: { fontSize: 26, marginBottom: 6 },
  optionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
  optionLabelActive: { color: colors.primary },

  budgetList: { gap: s.xs, marginBottom: s.xl },
  budgetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: s.md,
    paddingVertical: s.md,
  },
  budgetOptionActive: {
    backgroundColor: 'rgba(255,194,14,0.08)',
    borderColor: colors.primary,
  },
  budgetLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  budgetLabelActive: { color: colors.primary },
  budgetRange: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginTop: 2,
  },

  spinCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: radius.lg,
    ...shadows.glow,
  },
  spinCtaText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },

  // ============ SPINNING ============
  spinningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s.xl,
  },
  spinHalo: {
    width: 220,
    height: 220,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s['2xl'],
  },
  spinWheel: {
    width: 160,
    height: 160,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  spinWheelEmoji: { fontSize: 72 },
  spinningEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  spinningTitle: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 28,
    marginTop: s.xs,
  },

  // ============ RESULT ============
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: s.xl,
    paddingTop: s.lg,
  },
  confetti: {
    position: 'absolute',
    top: 20,
    fontSize: 24,
  },
  resultEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.lg,
  },
  resultCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.25)',
    borderRadius: radius['2xl'],
    padding: s.xl,
    alignItems: 'center',
  },
  resultImageContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.md,
  },
  resultEmoji: { fontSize: 48 },
  resultName: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  resultCategory: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginTop: 4,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    marginTop: s.md,
  },
  resultMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: colors.textFaint,
  },
  resultMetaText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },

  resultActions: {
    flexDirection: 'row',
    gap: s.xs,
    marginTop: s.xl,
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: s.md,
    borderRadius: radius.lg,
    gap: s.xs,
    ...shadows.glow,
  },
  acceptButtonText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
  rerollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s.lg,
    paddingVertical: s.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: 6,
  },
  rerollButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },

  quickOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: s.md,
    padding: s.md,
    borderRadius: radius.xl,
    width: '100%',
    gap: s.xs,
  },
  quickOrderText: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
});
