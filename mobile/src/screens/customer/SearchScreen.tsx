// ==========================================
// SEARCH SCREEN - BUSQUEDA DE RESTAURANTES
// ==========================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Restaurant } from '../../types';

const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  star: '#FFD700',
};

// Busquedas recientes mock
const RECENT_SEARCHES = ['Tacos', 'Pizza', 'Sushi', 'Hamburguesas'];

// Restaurantes populares mock
const POPULAR_RESTAURANTS: Partial<Restaurant>[] = [
  {
    id: '1',
    name: 'Tacos El Patron',
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
    if (query.length >= 2) {
      searchRestaurants();
    } else {
      setResults([]);
    }
  }, [query]);

  const searchRestaurants = async () => {
    setIsSearching(true);
    // Simular busqueda
    await new Promise(resolve => setTimeout(resolve, 300));
    const filtered = POPULAR_RESTAURANTS.filter(
      r => r.name?.toLowerCase().includes(query.toLowerCase()) ||
           r.category?.toLowerCase().includes(query.toLowerCase())
    );
    setResults(filtered);
    setIsSearching(false);
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (!recentSearches.includes(searchQuery)) {
      setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)]);
    }
  };

  const handleRestaurantPress = (restaurant: Partial<Restaurant>) => {
    navigation.navigate('RestaurantDetail', { restaurant });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
  };

  const renderRestaurantItem = ({ item }: { item: Partial<Restaurant> }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleRestaurantPress(item)}>
      <Image source={{ uri: item.logo }} style={styles.resultImage} />
      <View style={styles.resultInfo}>
        <Text style={styles.resultName}>{item.name}</Text>
        <Text style={styles.resultCategory}>{item.category}</Text>
        <View style={styles.resultMeta}>
          <Ionicons name="star" size={12} color={COLORS.star} />
          <Text style={styles.resultRating}>{item.rating}</Text>
          <Text style={styles.resultTime}> • {item.deliveryTime}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar restaurantes, comida..."
            placeholderTextColor={COLORS.gray}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isSearching ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : query.length >= 2 ? (
        <FlatList
          data={results}
          keyExtractor={item => item.id!}
          renderItem={renderRestaurantItem}
          contentContainerStyle={styles.resultsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No encontramos resultados para "{query}"</Text>
            </View>
          }
        />
      ) : (
        <View style={styles.suggestionsContainer}>
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Busquedas recientes</Text>
                <TouchableOpacity onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Limpiar</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((search, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recentItem}
                  onPress={() => handleSearch(search)}
                >
                  <Ionicons name="time-outline" size={18} color={COLORS.gray} />
                  <Text style={styles.recentText}>{search}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Popular */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Populares</Text>
            {POPULAR_RESTAURANTS.map(restaurant => (
              <TouchableOpacity
                key={restaurant.id}
                style={styles.resultItem}
                onPress={() => handleRestaurantPress(restaurant)}
              >
                <Image source={{ uri: restaurant.logo }} style={styles.resultImage} />
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{restaurant.name}</Text>
                  <Text style={styles.resultCategory}>{restaurant.category}</Text>
                </View>
                <Ionicons name="trending-up" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: COLORS.text,
  },
  loader: {
    marginTop: 40,
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  resultInfo: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  resultCategory: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  resultRating: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  resultTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
    textAlign: 'center',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  recentText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
});
