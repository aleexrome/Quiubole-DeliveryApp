import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Importamos AppNavigator con try-catch mental - si falla, mostramos error
let AppNavigator: React.ComponentType<any>;
let importError: string | null = null;

try {
  AppNavigator = require('./src/navigation/AppNavigator').default;
} catch (e: any) {
  importError = e.message;
  AppNavigator = () => <Text>Error loading navigator</Text>;
}

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Dar tiempo para que todo se inicialice
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  if (importError) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorTitle}>Error al cargar:</Text>
        <Text style={styles.errorText}>{importError}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fee',
    padding: 20,
  },
  errorTitle: {
    color: '#c00',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  errorText: {
    color: '#333',
    fontSize: 14,
    textAlign: 'center',
  },
});
