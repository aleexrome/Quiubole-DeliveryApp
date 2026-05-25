// ==========================================
// DEVOLÓN — Restaurant Product Edit (placeholder)
//
// Placeholder migrado al theme. Cuando se implemente el form real,
// extender con <Input variant="filled"/> + <Button variant="primary"/>.
// ==========================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Screen, Header, EmptyState } from '../../components/ui';
import { s } from '../../theme';

export default function ProductEditScreen() {
  const route = useRoute<any>();
  const productId = route.params?.productId;

  return (
    <Screen padded={false}>
      <Header
        title={productId ? 'Editar producto' : 'Nuevo producto'}
        eyebrow="CATÁLOGO"
      />
      <View style={styles.body}>
        <EmptyState
          icon="create-outline"
          title="Editor en construcción"
          subtitle="Aquí podrás editar nombre, precio, foto y disponibilidad del producto."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: s.xl },
});
