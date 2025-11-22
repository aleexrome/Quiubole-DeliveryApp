import React, { useEffect, useCallback } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AppNavigator from './src/navigation/AppNavigator';

// Mantener splash visible mientras carga
SplashScreen.preventAutoHideAsync();

export default function App() {
  const onLayoutRootView = useCallback(async () => {
    // Ocultar splash cuando la app este lista
    await SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <AppNavigator />
      </View>
    </SafeAreaProvider>
  );
}
