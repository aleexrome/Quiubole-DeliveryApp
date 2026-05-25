// ==========================================
// DEVOLÓN — <ErrorBoundary>
//
// Captura errores no controlados en el árbol React y muestra un estado
// premium en dark mode. En __DEV__ revela el mensaje exacto del error.
// ==========================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, s, radius, fontSize, fontWeight } from '../../theme';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('========== ErrorBoundary ==========');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('===================================');
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.iconHalo}>
            <Ionicons name="bug-outline" size={56} color={colors.danger} />
          </View>
          <Text style={styles.title}>Algo salió mal</Text>
          <Text style={styles.subtitle}>
            Ocurrió un error inesperado. Intenta de nuevo.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorLabel}>Dev only:</Text>
              <Text style={styles.errorMessage}>{this.state.error.message}</Text>
              <Text style={[styles.errorLabel, { marginTop: 8 }]}>Stack:</Text>
              <Text style={[styles.errorMessage, { fontSize: 10 }]}>
                {(this.state.error.stack || '').split('\n').slice(0, 8).join('\n')}
              </Text>
            </View>
          )}
          <View style={styles.action}>
            <Button
              label="INTENTAR DE NUEVO"
              icon="refresh"
              iconPosition="left"
              onPress={this.handleRetry}
              size="md"
              fullWidth={false}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s['2xl'],
  },
  iconHalo: {
    width: 112,
    height: 112,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.xl,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xs,
    lineHeight: 20,
    paddingHorizontal: s.md,
  },
  errorBox: {
    marginTop: s.lg,
    padding: s.md,
    backgroundColor: 'rgba(229,72,77,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(229,72,77,0.25)',
    borderRadius: radius.md,
    width: '100%',
  },
  errorLabel: {
    color: colors.danger,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  errorMessage: {
    color: colors.danger,
    fontSize: fontSize.sm,
    fontFamily: 'monospace',
  },
  action: { marginTop: s.xl },
});
