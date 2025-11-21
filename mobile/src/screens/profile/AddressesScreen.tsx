import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from '../../utils/reanimatedShim';
import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';

const MOCK_ADDRESSES = [
  { id: '1', name: 'Casa', street: 'Av. Insurgentes Sur 1234', neighborhood: 'Col. Del Valle', isDefault: true },
  { id: '2', name: 'Oficina', street: 'Paseo de la Reforma 500', neighborhood: 'Col. Juárez', isDefault: false },
];

const AddressesScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis direcciones</Text>
        <TouchableOpacity><Ionicons name="add" size={24} color={colors.primary} /></TouchableOpacity>
      </View>
      <FlatList
        data={MOCK_ADDRESSES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
            <TouchableOpacity style={styles.addressCard}>
              <View style={styles.addressIcon}>
                <Ionicons name={item.name === 'Casa' ? 'home' : 'business'} size={20} color={colors.primary} />
              </View>
              <View style={styles.addressContent}>
                <View style={styles.addressHeader}>
                  <Text style={styles.addressName}>{item.name}</Text>
                  {item.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultText}>Predeterminada</Text></View>}
                </View>
                <Text style={styles.addressStreet}>{item.street}</Text>
                <Text style={styles.addressNeighborhood}>{item.neighborhood}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg },
  backButton: { width: 40, height: 40, borderRadius: borderRadius.full, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadows.sm },
  headerTitle: { ...typography.h3, color: colors.text },
  listContent: { padding: spacing.lg },
  addressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  addressIcon: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  addressContent: { flex: 1 },
  addressHeader: { flexDirection: 'row', alignItems: 'center' },
  addressName: { ...typography.bodyBold, color: colors.text },
  defaultBadge: { backgroundColor: colors.primary + '20', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.sm, marginLeft: spacing.sm },
  defaultText: { ...typography.small, color: colors.primary, fontWeight: '600' },
  addressStreet: { ...typography.body, color: colors.text, marginTop: spacing.xs },
  addressNeighborhood: { ...typography.caption, color: colors.textSecondary },
});

export default AddressesScreen;
