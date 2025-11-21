// Shim for react-native-reanimated to work on web and iOS without native modules
import { Animated, View, Text, Image, ScrollView, FlatList } from 'react-native';
import React from 'react';

// Create animated components using React Native's Animated API
const AnimatedView = Animated.View;
const AnimatedText = Animated.Text;
const AnimatedImage = Animated.Image;
const AnimatedScrollView = Animated.ScrollView;
const AnimatedFlatList = Animated.FlatList;

// Simple entering animations (no-op for now, just renders immediately)
const createEnteringAnimation = () => ({
  delay: () => createEnteringAnimation(),
  duration: () => createEnteringAnimation(),
  springify: () => createEnteringAnimation(),
});

export const FadeIn = createEnteringAnimation();
export const FadeInDown = createEnteringAnimation();
export const FadeInUp = createEnteringAnimation();
export const FadeInRight = createEnteringAnimation();
export const SlideInDown = createEnteringAnimation();
export const SlideInRight = createEnteringAnimation();

// Hooks that return simple values
export const useSharedValue = (initialValue: number) => ({
  value: initialValue,
});

export const useAnimatedStyle = (styleFunction: () => any) => {
  return styleFunction();
};

export const useAnimatedScrollHandler = (handlers: any) => {
  return (event: any) => {
    if (handlers.onScroll) {
      handlers.onScroll(event.nativeEvent);
    }
  };
};

// Animation functions (no-op)
export const withSpring = (value: number, config?: any, callback?: any) => {
  if (callback) callback();
  return value;
};

export const withTiming = (value: number, config?: any, callback?: any) => {
  if (callback) callback();
  return value;
};

export const interpolate = (
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate?: any
) => {
  // Simple linear interpolation
  const clampedIndex = Math.max(0, Math.min(inputRange.length - 2,
    inputRange.findIndex((v, i) => value >= v && value <= inputRange[i + 1])
  ));

  if (clampedIndex === -1) {
    return outputRange[0];
  }

  const inputStart = inputRange[clampedIndex];
  const inputEnd = inputRange[clampedIndex + 1];
  const outputStart = outputRange[clampedIndex];
  const outputEnd = outputRange[clampedIndex + 1];

  const ratio = (value - inputStart) / (inputEnd - inputStart);
  return outputStart + ratio * (outputEnd - outputStart);
};

export const Extrapolate = {
  CLAMP: 'clamp',
  EXTEND: 'extend',
  IDENTITY: 'identity',
};

// Default export with Animated components
const ReanimatedShim = {
  View: AnimatedView,
  Text: AnimatedText,
  Image: AnimatedImage,
  ScrollView: AnimatedScrollView,
  FlatList: AnimatedFlatList,
  // For compatibility
  createAnimatedComponent: (component: any) => Animated.createAnimatedComponent(component),
};

export default ReanimatedShim;
