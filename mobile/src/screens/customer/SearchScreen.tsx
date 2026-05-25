// ==========================================
// DEVOLÓN — Customer Search
//
// Búsqueda con sugerencias recientes y populares en dark mode. Input
// premium con autoFocus, chips de búsquedas recientes, cards glass.
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Restaurant } from '../../types';
import { Screen, Input, Card, Section } from '../../components/ui';
import { colors, s, radius, fontSize, fontWeight, tracking } from '../../theme';

const RECENT_SEARCHES = ['Tacos', 'Pizza', 'Sushi', 'Burgers'];

const POPULAR: Partial<Restaurant>[] = [
  {
    id: '1',
    name: 'Tacos El Patrón',
    category: 'Tacos',
    rating: 4.8,
    logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    deliveryTime: '20-30 min',
  },
  {
    id: '2',
    name: 'Pizza Napoli',
    category: 'Pizza',
    rating: 4.6,
    logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200',
    deliveryTime: '30-45 min',
  },
];

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Partial<Restaurant>[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES);

  useEffect(() => {
    if (query.length >= 2) doSearch();
    else setResults([]);
  }, [query]);

  const doSearch = async () => {
    setIsSearching(true);
    await new Promise((r) => setTimeout(r, 300));
    const q = query.toLowerCase();
    setResults(
      POPULAR.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q),
      ),
    );
    setIsSearching(false);
  };

  const handleSearchChip = (term: string) => {
    setQuery(term);
    if (!recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches.slice(0, 4)]);
    }
  };

  const handleRestaurantPress = (restaurant: Partial<Restaurant>) => {
    navigation.navigate('RestaurantDetail', { restaurant });
  };

  const renderResult = ({ item }: { item: Partial<Restaurant> }) => (
    <Card
      variant="glass"
      padding={s.sm}
      borderRadius={radius.lg}
      onPress={() => handleRestaurantPress(item)}
      style={styles.resultCard}
    >
      <Image source={{ uri: item.logo }} style={styles.resultImage} />
      <View style={styles.resultBody}>
        <Text style={styles.resultName}>{item.name}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="star" size={11} color={colors.primary} />
          <Text style={styles.resultRating}>{item.rating}</Text>
          <Text style={styles.resultDot}> • </Text>
          <Text style={styles.resultCategory}>{item.category}</Text>
          {item.deliveryTime && (
            <>
              <Text style={styles.resultDot}> • </Text>
              <Text style={styles.resultTime}>{item.deliveryTime}</Text>
            </>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Card>
  );

  return (
    <Screen padded={false}>
      <View style={styles.searchWrap}>
        <Input
          variant="filled"
          icon="search"
          placeholder="Restaurantes, comida…"
          value={query}
          onChangeText={setQuery}
          autoFocus
          rightIcon={query ? 'close-circle' : undefined}
          onRightIconPress={() => setQuery('')}
        />
      </View>

      {isSearching ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: s['2xl'] }} />
      ) : query.length >= 2 ? (
        <FlatList
          data={results}
          keyExtractor={(i) => i.id!}
          renderItem={renderResult}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={colors.textFaint} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySubtitle}>
                No encontramos nada para "{query}"
              </Text>
            </View>
          }
        />
      ) : (
        <View style={styles.suggestions}>
          {recentSearches.length > 0 && (
            <Section
              title="Recientes"
              eyebrow="HISTORIAL"
              actionLabel="Limpiar"
              onActionPress={() => setRecentSearches([])}
            >
              <View style={styles.chipsRow}>
                {recentSearches.map((term, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => handleSearchChip(term)}
                    activeOpacity={0.85}
                    style={styles.chip}
                  >
                    <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.chipText}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Section>
          )}

          <Section title="Populares" eyebrow="EN TENDENCIA">
            {POPULAR.map((r) => (
              <Card
                key={r.id}
                variant="glass"
                padding={s.sm}
                borderRadius={radius.lg}
                onPress={() => handleRestaurantPress(r)}
                style={styles.resultCard}
              >
                <Image source={{ uri: r.logo }} style={styles.resultImage} />
                <View style={styles.resultBody}>
                  <Text style={styles.resultName}>{r.name}</Text>
                  <Text style={styles.resultCategory}>{r.category}</Text>
                </View>
                <Ionicons name="trending-up" size={18} color={colors.primary} />
              </Card>
            ))}
          </Section>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
    paddingBottom: s.md,
  },
  resultsList: { paddingHorizontal: s.xl, paddingBottom: s['3xl'] },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.xs,
  },
  resultImage: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
  },
  resultBody: { flex: 1 },
  resultName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  resultRating: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    marginLeft: 3,
  },
  resultCategory: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  resultTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  resultDot: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: s['3xl'],
    gap: s.xs,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    marginTop: s.sm,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    textAlign: 'center',
    paddingHorizontal: s.lg,
  },

  suggestions: {
    flex: 1,
    paddingHorizontal: s.xl,
    paddingTop: s.sm,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s.md,
    paddingVertical: s.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },
});
