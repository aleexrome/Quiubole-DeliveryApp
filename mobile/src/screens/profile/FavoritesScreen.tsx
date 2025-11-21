import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from '../../utils/reanimatedShim';
import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';

const MOCK_FAVORITES = [
  { id: '1', name: 'Burger Palace', image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400', rating: 4.8, deliveryTime: '25-35' },
  { id: '2', name: 'Sushi Master', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', rating: 4.9, deliveryTime: '30-45' },
];

const FavoritesScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Favoritos</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={MOCK_FAVORITES}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
            <TouchableOpacity style={styles.favoriteCard}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <View style={styles.cardMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="star" size={14} color={colors.accent} />
                    <Text style={styles.metaText}>{item.rating}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.metaText}>{item.deliveryTime} min</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.heartButton}>
                <Ionicons name="heart" size={22} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>💔</Text>
            <Text style={styles.emptyTitle}>No tienes favoritos</Text>
            <Text style={styles.emptySubtitle}>Guarda tus restaurantes favoritos aquí</Text>
          </View>
        }
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
  favoriteCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginBottom: spacing.md, overflow: 'hidden', ...shadows.md },
  cardImage: { width: 80, height: 80 },
  cardContent: { flex: 1, padding: spacing.md },
  cardTitle: { ...typography.bodyBold, color: colors.text },
  cardMeta: { flexDirection: 'row', marginTop: spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  metaText: { ...typography.caption, color: colors.textSecondary, marginLeft: 4 },
  heartButton: { padding: spacing.md },
  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl * 2 },
  emptyEmoji: { fontSize: 60, marginBottom: spacing.md },
  emptyTitle: { ...typography.h3, color: colors.text },
  emptySubtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
});

export default FavoritesScreen;
