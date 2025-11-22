// ==========================================
// STORIES SCREEN - STORIES DE RESTAURANTES
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000; // 5 segundos por historia

const COLORS = {
  primary: '#FF6B35',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6C757D',
  overlay: 'rgba(0,0,0,0.3)',
};

interface Story {
  id: string;
  type: 'image' | 'promo' | 'product';
  imageUrl?: string;
  backgroundColor?: string;
  emoji?: string;
  title?: string;
  subtitle?: string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  promoCode?: string;
  promoDiscount?: string;
}

interface RestaurantStories {
  restaurantId: string;
  restaurantName: string;
  restaurantLogo: string;
  stories: Story[];
}

// Datos de ejemplo
const MOCK_STORIES: RestaurantStories[] = [
  {
    restaurantId: '1',
    restaurantName: 'Tacos El Primo',
    restaurantLogo: '🌮',
    stories: [
      {
        id: 's1',
        type: 'promo',
        backgroundColor: '#FF6B35',
        emoji: '🔥',
        title: '2x1 en Tacos!',
        subtitle: 'Solo hoy de 6pm a 10pm',
        promoCode: 'TACOS2X1',
        promoDiscount: '50%',
      },
      {
        id: 's2',
        type: 'product',
        backgroundColor: '#2E4057',
        emoji: '🌮',
        productId: 'prod-1',
        productName: 'Taco de Pastor',
        productPrice: 35,
        title: 'Nuevo!',
        subtitle: 'Taco de Pastor con pina asada',
      },
      {
        id: 's3',
        type: 'image',
        backgroundColor: '#4CAF50',
        emoji: '🥑',
        title: 'Guacamole fresco',
        subtitle: 'Preparado al momento',
      },
    ],
  },
  {
    restaurantId: '2',
    restaurantName: 'Sushi Kyoto',
    restaurantLogo: '🍣',
    stories: [
      {
        id: 's4',
        type: 'promo',
        backgroundColor: '#E91E63',
        emoji: '🍣',
        title: '30% OFF',
        subtitle: 'En rolls especiales',
        promoCode: 'SUSHI30',
        promoDiscount: '30%',
      },
      {
        id: 's5',
        type: 'product',
        backgroundColor: '#9C27B0',
        emoji: '🥢',
        productId: 'prod-2',
        productName: 'Dragon Roll',
        productPrice: 189,
        title: 'Best Seller',
        subtitle: 'El favorito de nuestros clientes',
      },
    ],
  },
];

export default function StoriesScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialIndex = route.params?.restaurantIndex || 0;

  const [currentRestaurant, setCurrentRestaurant] = useState(initialIndex);
  const [currentStory, setCurrentStory] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnimations = useRef<Animated.Value[]>([]);

  const restaurant = MOCK_STORIES[currentRestaurant];
  const story = restaurant?.stories[currentStory];

  useEffect(() => {
    // Inicializar animaciones de progreso
    progressAnimations.current = restaurant?.stories.map(() => new Animated.Value(0)) || [];
  }, [currentRestaurant]);

  useEffect(() => {
    if (!restaurant || isPaused) return;

    // Reiniciar animacion actual
    progressAnimations.current[currentStory]?.setValue(0);

    // Animar progreso
    const animation = Animated.timing(progressAnimations.current[currentStory], {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) {
        goToNextStory();
      }
    });

    return () => animation.stop();
  }, [currentStory, currentRestaurant, isPaused]);

  const goToNextStory = () => {
    if (currentStory < restaurant.stories.length - 1) {
      // Completar barra actual
      progressAnimations.current[currentStory]?.setValue(1);
      setCurrentStory(currentStory + 1);
    } else {
      // Ir al siguiente restaurante
      goToNextRestaurant();
    }
  };

  const goToPreviousStory = () => {
    if (currentStory > 0) {
      // Reiniciar barra actual y la anterior
      progressAnimations.current[currentStory]?.setValue(0);
      setCurrentStory(currentStory - 1);
    } else if (currentRestaurant > 0) {
      // Ir al restaurante anterior
      goToPreviousRestaurant();
    }
  };

  const goToNextRestaurant = () => {
    if (currentRestaurant < MOCK_STORIES.length - 1) {
      setCurrentRestaurant(currentRestaurant + 1);
      setCurrentStory(0);
    } else {
      navigation.goBack();
    }
  };

  const goToPreviousRestaurant = () => {
    if (currentRestaurant > 0) {
      setCurrentRestaurant(currentRestaurant - 1);
      const prevRestaurant = MOCK_STORIES[currentRestaurant - 1];
      setCurrentStory(prevRestaurant.stories.length - 1);
    }
  };

  const handleTap = (side: 'left' | 'right') => {
    if (side === 'left') {
      goToPreviousStory();
    } else {
      goToNextStory();
    }
  };

  const handleLongPressIn = () => setIsPaused(true);
  const handleLongPressOut = () => setIsPaused(false);

  const handleViewProduct = () => {
    navigation.navigate('RestaurantDetail', {
      restaurantId: restaurant.restaurantId,
      highlightProduct: story?.productId,
    });
  };

  const handleUsePromo = () => {
    // Copiar codigo y navegar al restaurante
    navigation.navigate('RestaurantDetail', {
      restaurantId: restaurant.restaurantId,
      promoCode: story?.promoCode,
    });
  };

  if (!restaurant || !story) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="black" />

      <TouchableWithoutFeedback
        onPressIn={handleLongPressIn}
        onPressOut={handleLongPressOut}
      >
        <View style={[styles.storyContent, { backgroundColor: story.backgroundColor || COLORS.black }]}>
          {/* Progress bars */}
          <View style={styles.progressContainer}>
            {restaurant.stories.map((_, index) => (
              <View key={index} style={styles.progressBarBackground}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: progressAnimations.current[index]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }) || '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.restaurantInfo}>
              <View style={styles.restaurantLogo}>
                <Text style={styles.restaurantLogoEmoji}>{restaurant.restaurantLogo}</Text>
              </View>
              <Text style={styles.restaurantName}>{restaurant.restaurantName}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Story Content */}
          <View style={styles.storyBody}>
            <Text style={styles.storyEmoji}>{story.emoji}</Text>
            {story.title && <Text style={styles.storyTitle}>{story.title}</Text>}
            {story.subtitle && <Text style={styles.storySubtitle}>{story.subtitle}</Text>}

            {story.type === 'product' && story.productPrice && (
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>${story.productPrice}</Text>
              </View>
            )}

            {story.type === 'promo' && story.promoCode && (
              <View style={styles.promoCodeContainer}>
                <Text style={styles.promoCodeLabel}>Codigo:</Text>
                <Text style={styles.promoCodeText}>{story.promoCode}</Text>
              </View>
            )}
          </View>

          {/* Touch areas */}
          <View style={styles.touchAreas}>
            <TouchableOpacity
              style={styles.touchLeft}
              onPress={() => handleTap('left')}
              activeOpacity={1}
            />
            <TouchableOpacity
              style={styles.touchRight}
              onPress={() => handleTap('right')}
              activeOpacity={1}
            />
          </View>

          {/* Bottom Action */}
          <View style={styles.bottomAction}>
            {story.type === 'product' && (
              <TouchableOpacity style={styles.actionButton} onPress={handleViewProduct}>
                <Text style={styles.actionButtonText}>Ver producto</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}
            {story.type === 'promo' && (
              <TouchableOpacity style={styles.actionButton} onPress={handleUsePromo}>
                <Text style={styles.actionButtonText}>Usar promocion</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}
            {story.type === 'image' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('RestaurantDetail', { restaurantId: restaurant.restaurantId })}
              >
                <Text style={styles.actionButtonText}>Ver restaurante</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Swipe Indicator */}
          <View style={styles.swipeIndicator}>
            <Ionicons name="chevron-up" size={24} color={COLORS.white} />
            <Text style={styles.swipeText}>Desliza para ver menu</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  storyContent: {
    flex: 1,
  },

  // Progress bars
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 50,
    gap: 4,
  },
  progressBarBackground: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: 2,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  restaurantLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restaurantLogoEmoji: {
    fontSize: 20,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Story Body
  storyBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  storyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  storyTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  storySubtitle: {
    fontSize: 18,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  priceTag: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 20,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  promoCodeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  promoCodeLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },
  promoCodeText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.white,
    letterSpacing: 3,
    marginTop: 4,
  },

  // Touch areas
  touchAreas: {
    position: 'absolute',
    top: 100,
    bottom: 200,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  touchLeft: {
    flex: 1,
  },
  touchRight: {
    flex: 2,
  },

  // Bottom Action
  bottomAction: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },

  // Swipe Indicator
  swipeIndicator: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  swipeText: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 4,
  },
});
