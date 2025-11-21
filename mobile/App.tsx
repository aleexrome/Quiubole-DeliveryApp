import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as SecureStore from 'expo-secure-store';

import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/context/store';
import { authApi } from './src/services/api';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const { setUser, setToken } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        // Check for existing token
        const token = await SecureStore.getItemAsync('token');

        if (token) {
          setToken(token);
          try {
            // Verify token and get user profile
            const profile = await authApi.getProfile();
            setUser(profile);
          } catch {
            // Token invalid, clear it
            await SecureStore.deleteItemAsync('token');
            setToken(null);
          }
        }
      } catch (e) {
        console.warn('Error loading auth state:', e);
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
