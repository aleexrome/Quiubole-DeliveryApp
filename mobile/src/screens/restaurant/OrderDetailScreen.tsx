// ==========================================
// ORDER DETAIL SCREEN - DETALLE DE PEDIDO (RESTAURANTE)
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function OrderDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const orderId = route.params?.orderId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Pedido #{orderId || '000'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.placeholder}>Detalle del pedido</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  content: { flex: 1, padding: 16 },
  placeholder: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 40 },
});
