// ==========================================
// DEVOLÓN — Cuenta en revisión / rechazada
//
// Pantalla "gate" que se muestra cuando el user tiene un rol que
// requiere aprobación (driver/restaurant/editor) pero todavía no la
// recibió. Si el admin rechazó la cuenta (rejectionReason != null),
// cambia el copy y el estado visual.
//
// El user puede:
//   • Esperar a que un admin lo apruebe (la app le pegará a /auth/profile
//     en cada foreground para detectar el cambio).
//   • Cerrar sesión.
// ==========================================

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, RefreshControl, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import { Button, Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const ROLE_NAME: Record<string, string> = {
  driver: 'repartidor',
  restaurant: 'negocio',
  merchant: 'negocio',
  editor: 'editor',
};

export default function PendingApprovalScreen() {
  const { user, logout } = useAuthStore();
  const setUser = useAuthStore.setState; // direct setState para refrescar
  const [refreshing, setRefreshing] = useState(false);

  const isRejected = !!user?.rejectionReason || user?.isActive === false;
  const roleLabel = ROLE_NAME[user?.role || ''] || 'cuenta';

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Cerrar sesión y volver al login?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
    ]);
  };

  // Pull-to-refresh: pega a /auth/profile para detectar si el admin ya
  // aprobó la cuenta. Si llega user.isApproved=true, el AppNavigator
  // automáticamente sale de esta pantalla.
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const profile = await authApi.getProfile();
      // Reemplaza solo el user en el store, conserva token/isAuthenticated.
      setUser((state: any) => ({ ...state, user: profile }));
    } catch (e) {
      // silencioso: el user verá el mismo estado, intenta de nuevo.
    } finally {
      setRefreshing(false);
    }
  }, [setUser]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.iconWrap}>
          <View style={[styles.iconHalo, isRejected && styles.iconHaloDanger]}>
            <Ionicons
              name={isRejected ? 'close-circle-outline' : 'time-outline'}
              size={64}
              color={isRejected ? colors.danger : colors.primary}
            />
          </View>
        </View>

        <Text style={styles.eyebrow}>
          {isRejected ? 'CUENTA NO APROBADA' : 'EN REVISIÓN'}
        </Text>
        <Text style={styles.title}>
          {isRejected
            ? 'Tu cuenta fue rechazada'
            : `Tu cuenta de ${roleLabel} está en revisión`}
        </Text>
        <Text style={styles.subtitle}>
          {isRejected
            ? 'Un administrador revisó tu cuenta y no fue aprobada. Si crees que es un error, contacta a soporte.'
            : 'Un administrador revisará tu información en breve. Te avisaremos cuando tu cuenta sea aprobada para que puedas empezar a operar.'}
        </Text>

        {isRejected && user?.rejectionReason && (
          <Card variant="glass" padding={s.md} borderRadius={radius.lg} style={styles.reasonCard}>
            <Text style={styles.reasonLabel}>MOTIVO</Text>
            <Text style={styles.reasonText}>{user.rejectionReason}</Text>
          </Card>
        )}

        <Card variant="glass" padding={s.md} borderRadius={radius.lg} style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="mail-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText} numberOfLines={1}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={16} color={colors.textMuted} />
            <Text style={styles.infoText}>
              {user?.firstName || user?.name} · {roleLabel.toUpperCase()}
            </Text>
          </View>
        </Card>

        <View style={styles.actions}>
          {!isRejected && (
            <Button
              label="VERIFICAR DE NUEVO"
              icon="refresh"
              iconPosition="left"
              variant="secondary"
              onPress={handleRefresh}
              loading={refreshing}
            />
          )}
          <View style={{ height: s.sm }} />
          <Button
            label="CERRAR SESIÓN"
            icon="log-out-outline"
            iconPosition="left"
            variant="ghost"
            onPress={handleLogout}
          />
        </View>

        {!isRejected && (
          <Text style={styles.hint}>
            Jala hacia abajo para actualizar el estado de tu cuenta.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: s.xl,
    paddingTop: s.xl,
    paddingBottom: s['2xl'],
    alignItems: 'center',
  },

  iconWrap: { marginTop: s.xl, marginBottom: s.xl },
  iconHalo: {
    width: 128,
    height: 128,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconHaloDanger: {
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderColor: 'rgba(229,72,77,0.32)',
  },

  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: s.sm,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    textAlign: 'center',
    paddingHorizontal: s.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: s.sm,
    paddingHorizontal: s.sm,
  },

  reasonCard: {
    marginTop: s.lg,
    width: '100%',
    borderColor: 'rgba(229,72,77,0.32)',
    backgroundColor: 'rgba(229,72,77,0.06)',
  },
  reasonLabel: {
    color: colors.danger,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    marginBottom: 4,
  },
  reasonText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },

  infoCard: {
    width: '100%',
    marginTop: s.lg,
    gap: s.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  infoText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },

  actions: {
    width: '100%',
    marginTop: s['2xl'],
  },

  hint: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.lg,
    paddingHorizontal: s.lg,
  },
});
