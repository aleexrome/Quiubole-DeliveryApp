// ==========================================
// PANTALLA DE SELECCION DE ROL (POST-REGISTRO)
// ==========================================

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function RoleSelectionScreen() {
  const navigation = useNavigation<any>();

  const roles = [
    {
      id: 'customer',
      title: 'Quiero Pedir',
      description: 'Explora restaurantes, haz pedidos y recibe en tu puerta',
      icon: 'fast-food',
      color: '#FF6B35',
      bgColor: '#FFF5F0',
    },
    {
      id: 'restaurant',
      title: 'Tengo un Negocio',
      description: 'Vende tus productos y llega a mas clientes',
      icon: 'restaurant',
      color: '#EC4899',
      bgColor: '#FDF2F8',
    },
    {
      id: 'driver',
      title: 'Quiero Repartir',
      description: 'Gana dinero haciendo entregas en tu tiempo libre',
      icon: 'bicycle',
      color: '#22C55E',
      bgColor: '#F0FDF4',
    },
  ];

  const handleSelect = (roleId: string) => {
    navigation.navigate('Register', { role: roleId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>Quiubole!</Text>
        <Text style={styles.title}>¿Como quieres usar la app?</Text>
        <Text style={styles.subtitle}>
          Selecciona tu rol para personalizar tu experiencia
        </Text>

        {/* Role Cards */}
        <View style={styles.cardsContainer}>
          {roles.map((role) => (
            <TouchableOpacity
              key={role.id}
              style={styles.card}
              onPress={() => handleSelect(role.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: role.bgColor }]}>
                <Ionicons name={role.icon as any} size={40} color={role.color} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{role.title}</Text>
                <Text style={styles.cardDescription}>{role.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ccc" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Already have account */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Inicia Sesion</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 32,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
});
