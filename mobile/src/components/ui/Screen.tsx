// ==========================================
// DEVOLÓN — <Screen>
//
// Wrapper estándar de pantalla. Aplica:
//  - bg negro absoluto del theme
//  - SafeArea por defecto (configurable)
//  - StatusBar light-content global
//  - padding horizontal consistente
//  - opcional: ScrollView con keyboard-aware
//
// Úsalo como root de TODA pantalla nueva. No hardcodear bg/safeArea en
// pantallas — todo viene de aquí.
// ==========================================

import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  type ScrollViewProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { colors, s } from '../../theme';

interface ScreenProps {
  children: React.ReactNode;
  /** Activa ScrollView con keyboard-aware. Default: false. */
  scroll?: boolean;
  /** Edges del safe area. Default: ['top','bottom']. */
  edges?: Edge[];
  /** Aplica padding horizontal estándar (s.xl). Default: true. */
  padded?: boolean;
  /** Bg override. Default: colors.bg. */
  background?: string;
  /** Permite ocultar la StatusBar local (si la pantalla la maneja sola). */
  manageStatusBar?: boolean;
  /** Estilo extra del contenedor interior. */
  style?: StyleProp<ViewStyle>;
  /** Props extra para ScrollView cuando scroll=true. */
  scrollProps?: ScrollViewProps;
  /** Desactiva SafeArea (para pantallas hero edge-to-edge). */
  noSafeArea?: boolean;
}

export default function Screen({
  children,
  scroll = false,
  edges = ['top', 'bottom'],
  padded = true,
  background = colors.bg,
  manageStatusBar = true,
  style,
  scrollProps,
  noSafeArea = false,
}: ScreenProps) {
  const Container = noSafeArea ? View : SafeAreaView;
  const containerProps = noSafeArea ? {} : { edges };

  const inner = scroll ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        styles.scrollContent,
        padded && styles.padded,
        style,
      ]}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, style]}>{children}</View>
  );

  return (
    <Container
      style={[styles.root, { backgroundColor: background }]}
      {...containerProps}
    >
      {manageStatusBar && (
        <StatusBar
          barStyle="light-content"
          backgroundColor={background}
          translucent={false}
        />
      )}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {inner}
      </KeyboardAvoidingView>
    </Container>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  padded: { paddingHorizontal: s.xl },
});
