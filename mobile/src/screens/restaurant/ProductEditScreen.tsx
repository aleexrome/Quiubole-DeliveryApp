// ==========================================
// PRODUCT EDIT SCREEN - EDITAR PRODUCTO
// ==========================================

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function ProductEditScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const productId = route.params?.productId;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>{productId ? 'Editar Producto' : 'Nuevo Producto'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.placeholder}>Editor de producto</Text>
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
