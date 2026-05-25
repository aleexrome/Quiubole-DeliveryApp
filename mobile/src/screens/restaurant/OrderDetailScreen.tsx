// ==========================================
// DEVOLÓN — Restaurant Order Detail (placeholder)
//
// Placeholder migrado al theme. Cuando se implemente el detalle real,
// usar <Card variant="glass"/> para bloques de info + <Button/> para
// acciones (aceptar / rechazar / marcar listo).
// ==========================================

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { Screen, Header, EmptyState } from '../../components/ui';
import { s } from '../../theme';

export default function OrderDetailScreen() {
  const route = useRoute<any>();
  const orderId = route.params?.orderId;

  return (
    <Screen padded={false}>
      <Header title={`Pedido #${orderId || '000'}`} eyebrow="DETALLE" />
      <View style={styles.body}>
        <EmptyState
          icon="receipt-outline"
          title="Detalle en construcción"
          subtitle="Aquí verás los items, el cliente y las acciones del pedido."
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: s.xl },
});
