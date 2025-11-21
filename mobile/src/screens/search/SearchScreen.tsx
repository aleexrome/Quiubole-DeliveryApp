import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from '../../utils/reanimatedShim';

import { colors, spacing, borderRadius, shadows, typography } from '../../utils/theme';

const RECENT_SEARCHES = ['Tacos', 'Pizza', 'Sushi', 'Hamburguesas'];
const POPULAR_SEARCHES = ['Comida mexicana', 'Postres', 'Café', 'Healthy'];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View entering={FadeIn.duration(400)}>
        <Text style={styles.title}>Buscar</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="¿Qué se te antoja?"
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Recent Searches */}
      <Animated.View
        style={styles.section}
        entering={FadeInDown.delay(200).duration(400)}
      >
        <Text style={styles.sectionTitle}>Búsquedas recientes</Text>
        <View style={styles.tagsContainer}>
          {RECENT_SEARCHES.map((item, index) => (
            <TouchableOpacity key={index} style={styles.tag}>
              <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.tagText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Popular */}
      <Animated.View
        style={styles.section}
        entering={FadeInDown.delay(300).duration(400)}
      >
        <Text style={styles.sectionTitle}>Popular ahora</Text>
        <View style={styles.tagsContainer}>
          {POPULAR_SEARCHES.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.tag, styles.popularTag]}>
              <Ionicons name="trending-up" size={14} color={colors.primary} />
              <Text style={[styles.tagText, styles.popularTagText]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Categories Grid */}
      <Animated.View
        style={styles.section}
        entering={FadeInDown.delay(400).duration(400)}
      >
        <Text style={styles.sectionTitle}>Explora por categoría</Text>
        <View style={styles.categoriesGrid}>
          {['🍔 Comida rápida', '🍕 Pizza', '🍣 Sushi', '🌮 Mexicana', '🥗 Saludable', '☕ Café', '🍩 Postres', '🍺 Bebidas'].map((item, index) => (
            <TouchableOpacity key={index} style={styles.categoryCard}>
              <Text style={styles.categoryText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  title: {
    ...typography.h1,
    color: colors.text,
    marginVertical: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    marginLeft: spacing.sm,
    paddingVertical: spacing.sm,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.bodyBold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  tagText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  popularTag: {
    backgroundColor: colors.primaryLight + '20',
  },
  popularTagText: {
    color: colors.primary,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    width: '48%',
    ...shadows.sm,
  },
  categoryText: {
    ...typography.body,
    color: colors.text,
  },
});

export default SearchScreen;
