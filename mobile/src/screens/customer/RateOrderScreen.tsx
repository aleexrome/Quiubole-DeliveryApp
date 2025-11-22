// ==========================================
// RATE ORDER SCREEN - CALIFICAR PEDIDO
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

// Colores de la marca
const COLORS = {
  primary: '#FF6B35',
  secondary: '#2E4057',
  background: '#F8F9FA',
  white: '#FFFFFF',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  text: '#212529',
  textLight: '#6C757D',
  success: '#4CAF50',
  star: '#FFD700',
  starEmpty: '#E0E0E0',
};

// Tags predefinidos
const POSITIVE_TAGS = [
  'Comida deliciosa',
  'Buen precio',
  'Rapido',
  'Buena presentacion',
  'Porciones generosas',
  'Excelente servicio',
];

const NEGATIVE_TAGS = [
  'Tardo mucho',
  'Comida fria',
  'Mal empacado',
  'Pedido incorrecto',
  'Porciones pequenas',
];

const DRIVER_POSITIVE_TAGS = [
  'Muy amable',
  'Entrega puntual',
  'Buena comunicacion',
  'Cuidadoso con el pedido',
];

const DRIVER_NEGATIVE_TAGS = [
  'Llego tarde',
  'Mala actitud',
  'Sin seguimiento',
  'Pedido danado',
];

// Componente de estrellas
const StarRating = ({
  rating,
  onRate,
  size = 36,
  label,
}: {
  rating: number;
  onRate: (rating: number) => void;
  size?: number;
  label?: string;
}) => (
  <View style={styles.starContainer}>
    {label && <Text style={styles.starLabel}>{label}</Text>}
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => onRate(star)} style={styles.starButton}>
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? COLORS.star : COLORS.starEmpty}
          />
        </TouchableOpacity>
      ))}
    </View>
    <Text style={styles.ratingText}>
      {rating === 0
        ? 'Toca para calificar'
        : rating === 1
        ? 'Muy malo'
        : rating === 2
        ? 'Malo'
        : rating === 3
        ? 'Regular'
        : rating === 4
        ? 'Bueno'
        : 'Excelente'}
    </Text>
  </View>
);

// Componente de tags seleccionables
const TagSelector = ({
  tags,
  selectedTags,
  onToggle,
  title,
}: {
  tags: string[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
  title: string;
}) => (
  <View style={styles.tagSection}>
    <Text style={styles.tagTitle}>{title}</Text>
    <View style={styles.tagsContainer}>
      {tags.map(tag => (
        <TouchableOpacity
          key={tag}
          style={[styles.tag, selectedTags.includes(tag) && styles.tagSelected]}
          onPress={() => onToggle(tag)}
        >
          <Text style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextSelected]}>
            {tag}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

export default function RateOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || {};

  // Mock order data - En produccion vendria de la API
  const order = {
    id: orderId || '1',
    orderNumber: 'QUB-001234',
    restaurant: {
      id: '1',
      name: 'Tacos El Patron',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    },
    driver: {
      id: '1',
      name: 'Carlos Martinez',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    },
  };

  const [restaurantRating, setRestaurantRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (restaurantRating === 0) {
      Alert.alert('Calificacion requerida', 'Por favor califica al restaurante');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Enviar a la API
      // await api.post('/reviews', {
      //   orderId: order.id,
      //   restaurantId: order.restaurant.id,
      //   driverId: order.driver.id,
      //   restaurantRating,
      //   driverRating,
      //   overallRating: Math.round((restaurantRating + (driverRating || restaurantRating)) / 2),
      //   tags: selectedTags,
      //   comment,
      //   wouldRecommend,
      // });

      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert(
        'Gracias por tu opinion!',
        'Tu calificacion nos ayuda a mejorar el servicio',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar tu calificacion. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Omitir calificacion',
      'Puedes calificar este pedido mas tarde desde tu historial',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Omitir', onPress: () => navigation.goBack() },
      ]
    );
  };

  // Tags a mostrar basados en la calificacion
  const restaurantTags = restaurantRating >= 4 ? POSITIVE_TAGS : restaurantRating > 0 ? NEGATIVE_TAGS : [];
  const driverTags = driverRating >= 4 ? DRIVER_POSITIVE_TAGS : driverRating > 0 ? DRIVER_NEGATIVE_TAGS : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calificar pedido</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderComplete}>Pedido completado</Text>
        </View>

        {/* Restaurant Rating */}
        <View style={styles.section}>
          <View style={styles.entityHeader}>
            <Image source={{ uri: order.restaurant.logo }} style={styles.entityImage} />
            <View style={styles.entityInfo}>
              <Text style={styles.entityName}>{order.restaurant.name}</Text>
              <Text style={styles.entityLabel}>Restaurante</Text>
            </View>
          </View>
          <StarRating
            rating={restaurantRating}
            onRate={setRestaurantRating}
            label="Como estuvo la comida?"
          />
          {restaurantTags.length > 0 && (
            <TagSelector
              tags={restaurantTags}
              selectedTags={selectedTags}
              onToggle={toggleTag}
              title="Que te parecio?"
            />
          )}
        </View>

        {/* Driver Rating */}
        <View style={styles.section}>
          <View style={styles.entityHeader}>
            <Image source={{ uri: order.driver.avatar }} style={styles.entityImage} />
            <View style={styles.entityInfo}>
              <Text style={styles.entityName}>{order.driver.name}</Text>
              <Text style={styles.entityLabel}>Repartidor</Text>
            </View>
          </View>
          <StarRating
            rating={driverRating}
            onRate={setDriverRating}
            label="Como fue la entrega?"
          />
          {driverTags.length > 0 && (
            <TagSelector
              tags={driverTags}
              selectedTags={selectedTags}
              onToggle={toggleTag}
              title="Que te parecio?"
            />
          )}
        </View>

        {/* Would Recommend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recomendarias este restaurante?</Text>
          <View style={styles.recommendButtons}>
            <TouchableOpacity
              style={[
                styles.recommendButton,
                wouldRecommend === true && styles.recommendButtonActive,
              ]}
              onPress={() => setWouldRecommend(true)}
            >
              <Ionicons
                name="thumbs-up"
                size={24}
                color={wouldRecommend === true ? COLORS.white : COLORS.success}
              />
              <Text
                style={[
                  styles.recommendText,
                  wouldRecommend === true && styles.recommendTextActive,
                ]}
              >
                Si
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recommendButton,
                wouldRecommend === false && styles.recommendButtonNegative,
              ]}
              onPress={() => setWouldRecommend(false)}
            >
              <Ionicons
                name="thumbs-down"
                size={24}
                color={wouldRecommend === false ? COLORS.white : COLORS.gray}
              />
              <Text
                style={[
                  styles.recommendText,
                  wouldRecommend === false && styles.recommendTextActive,
                ]}
              >
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comentario adicional (opcional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Cuentanos mas sobre tu experiencia..."
            placeholderTextColor={COLORS.gray}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={styles.submitText}>Enviar calificacion</Text>
              <Ionicons name="send" size={20} color={COLORS.white} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  skipText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  content: {
    flex: 1,
  },
  orderInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.white,
  },
  orderNumber: {
    fontSize: 14,
    color: COLORS.gray,
  },
  orderComplete: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginTop: 4,
  },
  section: {
    backgroundColor: COLORS.white,
    marginTop: 8,
    padding: 16,
  },
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  entityImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  entityInfo: {
    marginLeft: 12,
  },
  entityName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  entityLabel: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 2,
  },
  starContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  starLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  tagSection: {
    marginTop: 16,
  },
  tagTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
  },
  tagSelected: {
    backgroundColor: COLORS.primary,
  },
  tagText: {
    fontSize: 13,
    color: COLORS.text,
  },
  tagTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  recommendButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  recommendButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.lightGray,
    gap: 8,
  },
  recommendButtonActive: {
    backgroundColor: COLORS.success,
  },
  recommendButtonNegative: {
    backgroundColor: COLORS.gray,
  },
  recommendText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  recommendTextActive: {
    color: COLORS.white,
  },
  commentInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
