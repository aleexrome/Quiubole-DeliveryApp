// ==========================================
// DEVOLÓN — StoriesScreen
//
// Full-screen tap-to-advance stories. Bg negro absoluto del brand,
// imágenes con overlay gradient editorial (negro al pie). Progress bars
// finitas en blanco, header con avatar glass + nombre del restaurante.
// CTAs en pill amarillo con glow.
// ==========================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 5000;

interface Story {
  id: string;
  type: 'image' | 'promo' | 'product';
  imageUrl?: string;
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

const MOCK_STORIES: RestaurantStories[] = [
  {
    restaurantId: '1',
    restaurantName: 'Tacos El Primo',
    restaurantLogo: '🌮',
    stories: [
      {
        id: 's1',
        type: 'promo',
        emoji: '🔥',
        title: '2x1 en Tacos',
        subtitle: 'Solo hoy de 6pm a 10pm',
        promoCode: 'TACOS2X1',
        promoDiscount: '50%',
      },
      {
        id: 's2',
        type: 'product',
        emoji: '🌮',
        productId: 'prod-1',
        productName: 'Taco de Pastor',
        productPrice: 35,
        title: 'Nuevo en menú',
        subtitle: 'Taco de Pastor con piña asada',
      },
      {
        id: 's3',
        type: 'image',
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
        emoji: '🍣',
        title: '30% OFF',
        subtitle: 'En rolls especiales',
        promoCode: 'SUSHI30',
        promoDiscount: '30%',
      },
      {
        id: 's5',
        type: 'product',
        emoji: '🥢',
        productId: 'prod-2',
        productName: 'Dragon Roll',
        productPrice: 189,
        title: 'Best seller',
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
    progressAnimations.current =
      restaurant?.stories.map(() => new Animated.Value(0)) || [];
  }, [currentRestaurant]);

  useEffect(() => {
    if (!restaurant || isPaused) return;

    progressAnimations.current[currentStory]?.setValue(0);

    const animation = Animated.timing(progressAnimations.current[currentStory], {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => {
      if (finished) goToNextStory();
    });

    return () => animation.stop();
  }, [currentStory, currentRestaurant, isPaused]);

  const goToNextStory = () => {
    if (currentStory < restaurant.stories.length - 1) {
      progressAnimations.current[currentStory]?.setValue(1);
      setCurrentStory(currentStory + 1);
    } else {
      goToNextRestaurant();
    }
  };

  const goToPreviousStory = () => {
    if (currentStory > 0) {
      progressAnimations.current[currentStory]?.setValue(0);
      setCurrentStory(currentStory - 1);
    } else if (currentRestaurant > 0) {
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
    if (side === 'left') goToPreviousStory();
    else goToNextStory();
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
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      <TouchableWithoutFeedback
        onPressIn={handleLongPressIn}
        onPressOut={handleLongPressOut}
      >
        <View style={styles.storyContent}>
          {/* AMBIENT GRADIENT */}
          <LinearGradient
            colors={['rgba(255,194,14,0.18)', 'transparent', 'rgba(0,0,0,0.6)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* PROGRESS BARS */}
          <View style={styles.progressContainer}>
            {restaurant.stories.map((_, index) => (
              <View key={index} style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width:
                        progressAnimations.current[index]?.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }) || '0%',
                    },
                  ]}
                />
              </View>
            ))}
          </View>

          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.restaurantInfo}>
              <View style={styles.restaurantLogo}>
                <Text style={styles.restaurantLogoEmoji}>{restaurant.restaurantLogo}</Text>
              </View>
              <View>
                <Text style={styles.headerEyebrow}>DEVOLÓN STORIES</Text>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {restaurant.restaurantName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* STORY BODY */}
          <View style={styles.storyBody}>
            {story.emoji && <Text style={styles.storyEmoji}>{story.emoji}</Text>}

            {story.type === 'promo' && story.promoDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{story.promoDiscount}</Text>
                <Text style={styles.discountLabel}>DE DESCUENTO</Text>
              </View>
            )}

            {story.title && <Text style={styles.storyTitle}>{story.title}</Text>}
            {story.subtitle && <Text style={styles.storySubtitle}>{story.subtitle}</Text>}

            {story.type === 'product' && story.productPrice != null && (
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>${story.productPrice}</Text>
              </View>
            )}

            {story.type === 'promo' && story.promoCode && (
              <View style={styles.promoCodeContainer}>
                <Text style={styles.promoCodeLabel}>CÓDIGO</Text>
                <Text style={styles.promoCodeText}>{story.promoCode}</Text>
              </View>
            )}
          </View>

          {/* TAP AREAS */}
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

          {/* BOTTOM CTA */}
          <View style={styles.bottomAction}>
            {story.type === 'product' && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.cta}
                onPress={handleViewProduct}
              >
                <Text style={styles.ctaText}>VER PRODUCTO</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            )}
            {story.type === 'promo' && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.cta}
                onPress={handleUsePromo}
              >
                <Text style={styles.ctaText}>USAR PROMOCIÓN</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            )}
            {story.type === 'image' && (
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.cta}
                onPress={() =>
                  navigation.navigate('RestaurantDetail', {
                    restaurantId: restaurant.restaurantId,
                  })
                }
              >
                <Text style={styles.ctaText}>VER RESTAURANTE</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
              </TouchableOpacity>
            )}

            <View style={styles.swipeIndicator}>
              <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
              <Text style={styles.swipeText}>Desliza para ver menú</Text>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  storyContent: { flex: 1, backgroundColor: colors.bg },

  // ============ PROGRESS ============
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: s.xs,
    paddingTop: 50,
    gap: 4,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.text,
    borderRadius: 2,
  },

  // ============ HEADER ============
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s.md,
    paddingTop: s.sm,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
    flex: 1,
  },
  restaurantLogo: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantLogoEmoji: { fontSize: 20 },
  headerEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  restaurantName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============ BODY ============
  storyBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s.xl,
  },
  storyEmoji: {
    fontSize: 96,
    marginBottom: s.lg,
  },
  discountBadge: {
    alignItems: 'center',
    marginBottom: s.md,
  },
  discountText: {
    color: colors.primary,
    fontSize: 72,
    fontWeight: fontWeight.black,
    letterSpacing: -3,
    lineHeight: 76,
  },
  discountLabel: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginTop: -4,
  },
  storyTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: fontWeight.black,
    letterSpacing: -0.8,
    textAlign: 'center',
    lineHeight: 38,
  },
  storySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xs,
    lineHeight: 22,
  },
  priceTag: {
    paddingHorizontal: s.lg,
    paddingVertical: s.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginTop: s.lg,
    ...shadows.glow,
  },
  priceText: {
    color: colors.onPrimary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.5,
  },
  promoCodeContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.4)',
    borderStyle: 'dashed',
    paddingHorizontal: s.lg,
    paddingVertical: s.sm,
    borderRadius: radius.md,
    marginTop: s.lg,
    alignItems: 'center',
  },
  promoCodeLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  promoCodeText: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
    marginTop: 4,
  },

  // ============ TAP AREAS ============
  touchAreas: {
    position: 'absolute',
    top: 100,
    bottom: 180,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  touchLeft: { flex: 1 },
  touchRight: { flex: 2 },

  // ============ BOTTOM ============
  bottomAction: {
    paddingHorizontal: s.xl,
    paddingBottom: s.xl,
    gap: s.sm,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: s.md,
    borderRadius: radius.lg,
    gap: s.xs,
    ...shadows.glow,
  },
  ctaText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
  swipeIndicator: {
    alignItems: 'center',
    gap: 2,
  },
  swipeText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
});
