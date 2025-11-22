// ==========================================
// SURPRISE ME SCREEN - MODO SORPRENDEME
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  success: '#4CAF50',
  gold: '#FFD700',
};

// Datos de ejemplo
const MOCK_RESTAURANTS = [
  { id: '1', name: 'Tacos El Primo', category: 'Mexicana', rating: 4.8, deliveryTime: '25-35', image: '🌮' },
  { id: '2', name: 'Sushi Kyoto', category: 'Japonesa', rating: 4.6, deliveryTime: '30-40', image: '🍣' },
  { id: '3', name: 'Pizza Napoli', category: 'Italiana', rating: 4.5, deliveryTime: '25-35', image: '🍕' },
  { id: '4', name: 'Burger House', category: 'Americana', rating: 4.4, deliveryTime: '20-30', image: '🍔' },
  { id: '5', name: 'Wok Express', category: 'China', rating: 4.3, deliveryTime: '25-35', image: '🥡' },
  { id: '6', name: 'El Asador', category: 'Argentina', rating: 4.7, deliveryTime: '35-45', image: '🥩' },
  { id: '7', name: 'Mariscos del Pacifico', category: 'Mariscos', rating: 4.5, deliveryTime: '30-40', image: '🦐' },
  { id: '8', name: 'Veggie Garden', category: 'Vegetariana', rating: 4.4, deliveryTime: '20-30', image: '🥗' },
];

const PREFERENCES = [
  { id: 'any', label: 'Cualquier cosa', icon: '🎲' },
  { id: 'mexican', label: 'Mexicana', icon: '🌮' },
  { id: 'asian', label: 'Asiatica', icon: '🍜' },
  { id: 'fast', label: 'Rapida', icon: '🍔' },
  { id: 'healthy', label: 'Saludable', icon: '🥗' },
  { id: 'premium', label: 'Premium', icon: '⭐' },
];

const BUDGET_OPTIONS = [
  { id: 'any', label: 'Sin limite', range: '$$$' },
  { id: 'low', label: 'Economico', range: '$50-100' },
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
    }))
  ).current;

  const handleSpin = () => {
    setStep('spinning');

    // Animacion de giro
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
      // Seleccionar restaurante aleatorio
      const randomIndex = Math.floor(Math.random() * MOCK_RESTAURANTS.length);
      setResult(MOCK_RESTAURANTS[randomIndex]);
      setStep('result');

      // Animacion de resultado
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

      // Confetti
      confettiAnimations.forEach((anim, index) => {
        const randomX = (Math.random() - 0.5) * 300;
        const randomDelay = Math.random() * 200;

        Animated.sequence([
          Animated.delay(randomDelay),
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(anim.y, {
              toValue: 400,
              duration: 1500,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim.x, {
              toValue: randomX,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
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
    <View style={styles.preferencesContainer}>
      <View style={styles.preferencesHeader}>
        <Text style={styles.questionEmoji}>🎰</Text>
        <Text style={styles.questionText}>Que tipo de antojo tienes?</Text>
      </View>

      <View style={styles.optionsGrid}>
        {PREFERENCES.map((pref) => (
          <TouchableOpacity
            key={pref.id}
            style={[
              styles.optionCard,
              selectedPreference === pref.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedPreference(pref.id)}
          >
            <Text style={styles.optionEmoji}>{pref.icon}</Text>
            <Text
              style={[
                styles.optionLabel,
                selectedPreference === pref.id && styles.optionLabelSelected,
              ]}
            >
              {pref.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.budgetTitle}>Tu presupuesto</Text>
      <View style={styles.budgetOptions}>
        {BUDGET_OPTIONS.map((budget) => (
          <TouchableOpacity
            key={budget.id}
            style={[
              styles.budgetOption,
              selectedBudget === budget.id && styles.budgetOptionSelected,
            ]}
            onPress={() => setSelectedBudget(budget.id)}
          >
            <Text
              style={[
                styles.budgetLabel,
                selectedBudget === budget.id && styles.budgetLabelSelected,
              ]}
            >
              {budget.label}
            </Text>
            <Text
              style={[
                styles.budgetRange,
                selectedBudget === budget.id && styles.budgetRangeSelected,
              ]}
            >
              {budget.range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.spinButton} onPress={handleSpin}>
        <Ionicons name="shuffle" size={24} color={COLORS.white} />
        <Text style={styles.spinButtonText}>Sorprendeme!</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSpinning = () => (
    <View style={styles.spinningContainer}>
      <Animated.View
        style={[
          styles.spinWheel,
          {
            transform: [{ rotate: spin }, { scale: scaleAnimation }],
          },
        ]}
      >
        <Text style={styles.spinWheelEmoji}>🎰</Text>
      </Animated.View>
      <Text style={styles.spinningText}>Buscando tu sorpresa...</Text>
    </View>
  );

  const renderResult = () => (
    <Animated.View
      style={[styles.resultContainer, { opacity: resultOpacity }]}
    >
      {/* Confetti */}
      {confettiAnimations.map((anim, index) => (
        <Animated.Text
          key={index}
          style={[
            styles.confetti,
            {
              transform: [
                { translateY: anim.y },
                { translateX: anim.x },
              ],
              opacity: anim.opacity,
              left: `${50 + (index - 6) * 5}%`,
            },
          ]}
        >
          {['🎉', '🎊', '✨', '⭐'][index % 4]}
        </Animated.Text>
      ))}

      <Text style={styles.resultTitle}>Tu sorpresa!</Text>

      <View style={styles.resultCard}>
        <View style={styles.resultImageContainer}>
          <Text style={styles.resultEmoji}>{result?.image}</Text>
        </View>
        <Text style={styles.resultName}>{result?.name}</Text>
        <Text style={styles.resultCategory}>{result?.category}</Text>

        <View style={styles.resultMeta}>
          <View style={styles.resultMetaItem}>
            <Ionicons name="star" size={16} color={COLORS.gold} />
            <Text style={styles.resultMetaText}>{result?.rating}</Text>
          </View>
          <View style={styles.resultMetaItem}>
            <Ionicons name="time" size={16} color={COLORS.gray} />
            <Text style={styles.resultMetaText}>{result?.deliveryTime} min</Text>
          </View>
        </View>
      </View>

      <View style={styles.resultActions}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => {
          navigation.navigate('RestaurantDetail', { restaurantId: result?.id });
        }}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
          <Text style={styles.acceptButtonText}>Ver menu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.rerollButton} onPress={handleReset}>
          <Ionicons name="refresh" size={20} color={COLORS.primary} />
          <Text style={styles.rerollButtonText}>Otra vez</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.quickOrderButton}
        onPress={() => {
          Alert.alert(
            'Pedido rapido',
            'Ordenaremos algo delicioso para ti basado en los mas pedidos de este restaurante. Estas listo?',
            [
              { text: 'Cancelar', style: 'cancel' },
              {
                text: 'Sorprendeme!',
                onPress: () => navigation.navigate('Checkout', { surpriseOrder: true, restaurantId: result?.id }),
              },
            ]
          );
        }}
      >
        <Ionicons name="flash" size={20} color={COLORS.gold} />
        <Text style={styles.quickOrderText}>Pedido sorpresa completo</Text>
        <Ionicons name="arrow-forward" size={16} color={COLORS.gray} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sorprendeme</Text>
        <View style={{ width: 40 }} />
      </View>

      {step === 'preferences' && renderPreferences()}
      {step === 'spinning' && renderSpinning()}
      {step === 'result' && renderResult()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },

  // Preferences
  preferencesContainer: { flex: 1, padding: 16 },
  preferencesHeader: { alignItems: 'center', marginBottom: 24 },
  questionEmoji: { fontSize: 48, marginBottom: 12 },
  questionText: { fontSize: 20, fontWeight: '700', color: COLORS.text },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    width: '30%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  optionEmoji: { fontSize: 28, marginBottom: 8 },
  optionLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  optionLabelSelected: { color: COLORS.primary },

  budgetTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  budgetOptions: { gap: 8, marginBottom: 32 },
  budgetOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  budgetOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  budgetLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  budgetLabelSelected: { color: COLORS.primary },
  budgetRange: { fontSize: 13, color: COLORS.gray },
  budgetRangeSelected: { color: COLORS.primary },

  spinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
  },
  spinButtonText: { fontSize: 18, fontWeight: '700', color: COLORS.white },

  // Spinning
  spinningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinWheel: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  spinWheelEmoji: { fontSize: 64 },
  spinningText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray,
    marginTop: 24,
  },

  // Result
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    fontSize: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  resultImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultEmoji: { fontSize: 48 },
  resultName: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  resultCategory: { fontSize: 14, color: COLORS.gray, marginTop: 4 },
  resultMeta: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  resultMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultMetaText: { fontSize: 14, fontWeight: '600', color: COLORS.text },

  resultActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    width: '100%',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
  rerollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: 6,
  },
  rerollButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },

  quickOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  quickOrderText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.text },
});
