import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';
import type { OrdersStackScreenProps } from '../../navigation/types';

const OrderDetailsScreen = ({ navigation, route }: OrdersStackScreenProps<'OrderDetails'>) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalles del pedido</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedido #{route.params.orderId}</Text>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Estado</Text>
            <Text style={styles.value}>Entregado</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Fecha</Text>
            <Text style={styles.value}>20 Nov 2024, 14:30</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  backButton: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  headerRight: { width: 40 },
  content: { padding: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  infoCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm, ...shadows.sm },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.bodyBold, color: colors.text, marginTop: spacing.xs },
});

export default OrderDetailsScreen;
