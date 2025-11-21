// Shim for react-native-reanimated to work with Expo Go without native modules
// This provides no-op implementations that allow the app to render without animations
import { Animated, View, Text, Image, ScrollView, FlatList } from 'react-native';
import React from 'react';

// Create animated components using React Native's Animated API
const AnimatedView = Animated.View;
const AnimatedText = Animated.Text;
const AnimatedImage = Animated.Image;
const AnimatedScrollView = Animated.ScrollView;
const AnimatedFlatList = Animated.FlatList;

// Simple entering/exiting animations (no-op - just renders immediately)
const createAnimation = () => {
  const animation: any = {
    delay: () => animation,
    duration: () => animation,
    springify: () => animation,
    damping: () => animation,
    stiffness: () => animation,
    mass: () => animation,
    overshootClamping: () => animation,
    restDisplacementThreshold: () => animation,
    restSpeedThreshold: () => animation,
    withInitialValues: () => animation,
    withCallback: () => animation,
    easing: () => animation,
  };
  return animation;
};

// Entering animations
export const FadeIn = createAnimation();
export const FadeInDown = createAnimation();
export const FadeInUp = createAnimation();
export const FadeInLeft = createAnimation();
export const FadeInRight = createAnimation();
export const SlideInDown = createAnimation();
export const SlideInUp = createAnimation();
export const SlideInLeft = createAnimation();
export const SlideInRight = createAnimation();
export const ZoomIn = createAnimation();
export const BounceIn = createAnimation();
export const StretchInX = createAnimation();
export const StretchInY = createAnimation();

// Exiting animations
export const FadeOut = createAnimation();
export const FadeOutDown = createAnimation();
export const FadeOutUp = createAnimation();
export const FadeOutLeft = createAnimation();
export const FadeOutRight = createAnimation();
export const SlideOutDown = createAnimation();
export const SlideOutUp = createAnimation();
export const SlideOutLeft = createAnimation();
export const SlideOutRight = createAnimation();
export const ZoomOut = createAnimation();
export const BounceOut = createAnimation();

// Layout animations (no-op)
export const Layout = createAnimation();
export const LinearTransition = createAnimation();
export const SequencedTransition = createAnimation();
export const FadingTransition = createAnimation();

// SharedValue type for TypeScript
type SharedValue<T> = { value: T };

// Hooks that return simple values
export const useSharedValue = <T>(initialValue: T): SharedValue<T> => ({
  value: initialValue,
});

export const useAnimatedStyle = (styleFunction: () => any, deps?: any[]) => {
  return styleFunction();
};

export const useAnimatedScrollHandler = (handlers: any) => {
  return (event: any) => {
    if (handlers && handlers.onScroll) {
      handlers.onScroll(event.nativeEvent);
    }
  };
};

export const useDerivedValue = <T>(derivedFunction: () => T, deps?: any[]): SharedValue<T> => ({
  value: derivedFunction(),
});

export const useAnimatedGestureHandler = (handlers: any) => handlers;

export const useAnimatedRef = () => React.useRef(null);

export const useAnimatedProps = (propsFunction: () => any, deps?: any[]) => {
  return propsFunction();
};

// Animation functions (no-op - return value immediately)
export const withSpring = (value: number, config?: any, callback?: any) => {
  if (callback) callback(true);
  return value;
};

export const withTiming = (value: number, config?: any, callback?: any) => {
  if (callback) callback(true);
  return value;
};

export const withDelay = (delay: number, animation: any) => animation;

export const withSequence = (...animations: any[]) => animations[animations.length - 1] || 0;

export const withRepeat = (animation: any, numberOfReps?: number, reverse?: boolean, callback?: any) => {
  if (callback) callback(true);
  return animation;
};

export const withDecay = (config?: any, callback?: any) => {
  if (callback) callback(true);
  return 0;
};

export const cancelAnimation = (sharedValue: any) => {};

export const runOnJS = (fn: Function) => fn;

export const runOnUI = (fn: Function) => fn;

// Interpolation
export const interpolate = (
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate?: any
) => {
  if (inputRange.length < 2 || outputRange.length < 2) {
    return outputRange[0] || 0;
  }

  // Clamp to input range
  if (value <= inputRange[0]) return outputRange[0];
  if (value >= inputRange[inputRange.length - 1]) return outputRange[outputRange.length - 1];

  // Find the segment
  for (let i = 0; i < inputRange.length - 1; i++) {
    if (value >= inputRange[i] && value <= inputRange[i + 1]) {
      const inputStart = inputRange[i];
      const inputEnd = inputRange[i + 1];
      const outputStart = outputRange[i];
      const outputEnd = outputRange[i + 1];
      const ratio = (value - inputStart) / (inputEnd - inputStart);
      return outputStart + ratio * (outputEnd - outputStart);
    }
  }

  return outputRange[0];
};

export const interpolateColor = (
  value: number,
  inputRange: number[],
  outputRange: string[],
  colorSpace?: string
) => {
  const index = Math.min(
    Math.max(0, Math.floor(value)),
    outputRange.length - 1
  );
  return outputRange[index] || outputRange[0];
};

export const Extrapolate = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

export const Extrapolation = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

// Easing functions (simple passthroughs)
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  poly: (n: number) => (t: number) => Math.pow(t, n),
  sin: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  circle: (t: number) => 1 - Math.sqrt(1 - t * t),
  exp: (t: number) => Math.pow(2, 10 * (t - 1)),
  elastic: (bounciness?: number) => (t: number) => t,
  back: (s?: number) => (t: number) => t,
  bounce: (t: number) => t,
  bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => t,
  in: (easing: any) => easing,
  out: (easing: any) => easing,
  inOut: (easing: any) => easing,
};

// Default export with Animated components
const Reanimated = {
  View: AnimatedView,
  Text: AnimatedText,
  Image: AnimatedImage,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  createAnimatedComponent: (component: any) => {
    try {
      return Animated.createAnimatedComponent(component);
    } catch {
      return component;
    }
  },
};

export default Reanimated;
