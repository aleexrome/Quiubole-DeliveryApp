// ==========================================
// DEVOLÓN — Role Selection (pre-register)
//
// Tres cards glass premium con ícono halo y descripción. El acento amarillo
// es ÚNICO — los roles no compiten con paletas distintas; el seleccionado
// gana amarillo, los demás conservan la cromática brand.
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Screen, Header, Card } from '../../components/ui';
import { colors, s, radius, fontSize, fontWeight, tracking } from '../../theme';

type Role = {
  id: 'customer' | 'restaurant' | 'driver';
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ROLES: Role[] = [
  {
    id: 'customer',
    title: 'Quiero pedir',
    description: 'Explora restaurantes y recibe en tu puerta.',
    icon: 'fast-food-outline',
  },
  {
    id: 'restaurant',
    title: 'Tengo un negocio',
    description: 'Vende tus productos y llega a más clientes.',
    icon: 'storefront-outline',
  },
  {
    id: 'driver',
    title: 'Quiero repartir',
    description: 'Gana dinero entregando en tu tiempo libre.',
    icon: 'bicycle-outline',
  },
];

export default function RoleSelectionScreen() {
  const navigation = useNavigation<any>();

  const handleSelect = (roleId: Role['id']) => {
    navigation.navigate('Register', { role: roleId });
  };

  return (
    <Screen scroll padded={false}>
      <Header title="" />

      <View style={styles.head}>
        <Text style={styles.brand}>DEVOLÓN</Text>
        <Text style={styles.eyebrow}>EMPEZAR</Text>
        <Text style={styles.title}>¿Cómo quieres usar la app?</Text>
        <Text style={styles.subtitle}>
          Elige tu rol para personalizar la experiencia.
        </Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.cardsWrap}>
        {ROLES.map((role) => (
          <Card
            key={role.id}
            variant="glass"
            onPress={() => handleSelect(role.id)}
            padding={s.lg}
            borderRadius={radius.xl}
            style={styles.card}
          >
            <View style={styles.iconHalo}>
              <Ionicons name={role.icon} size={28} color={colors.primary} />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{role.title}</Text>
              <Text style={styles.cardDescription}>{role.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          </Card>
        ))}
      </View>

      <View style={styles.loginRow}>
        <Text style={styles.loginLead}>¿Ya tienes cuenta?</Text>
        <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          Inicia sesión →
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: s.xl,
    paddingTop: s.lg,
    alignItems: 'center',
    marginBottom: s['2xl'],
  },
  brand: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
    marginBottom: s.lg,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
    marginBottom: s.xs,
  },
  title: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    marginTop: s.xs,
    paddingHorizontal: s.md,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginTop: s.lg,
    opacity: 0.9,
  },

  cardsWrap: {
    paddingHorizontal: s.xl,
    gap: s.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  iconHalo: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,194,14,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,194,14,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  cardDescription: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
  },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s.xs,
    marginTop: s['2xl'],
    paddingBottom: s.xl,
  },
  loginLead: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
  },
  loginLink: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
});
