import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/context/store';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Clear any existing token on startup to avoid API verification issues
        // This ensures fresh login each time until backend is available
        await SecureStore.deleteItemAsync('token');
        setToken(null);
        setUser(null);
      } catch (e) {
        console.warn('Error clearing auth state:', e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
