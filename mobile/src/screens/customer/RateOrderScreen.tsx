// ==========================================
// DEVOLÓN — Rate Order
//
// Calificación post-entrega en dark. Header con close + skip. Restaurante
// y repartidor en cards glass con estrellas amarillas grandes (cinema feel).
// Tags pill seleccionables, recomendación thumbs up/down, comentario en
// Input filled multiline. CTA primario "ENVIAR CALIFICACIÓN" flotante.
// ==========================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Button, Card, Input } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

// ============ Predefined Tags ============
const POSITIVE_TAGS = [
  'Comida deliciosa',
  'Buen precio',
  'Rápido',
  'Buena presentación',
  'Porciones generosas',
  'Excelente servicio',
];

const NEGATIVE_TAGS = [
  'Tardó mucho',
  'Comida fría',
  'Mal empacado',
  'Pedido incorrecto',
  'Porciones pequeñas',
];

const DRIVER_POSITIVE_TAGS = [
  'Muy amable',
  'Entrega puntual',
  'Buena comunicación',
  'Cuidadoso con el pedido',
];

const DRIVER_NEGATIVE_TAGS = [
  'Llegó tarde',
  'Mala actitud',
  'Sin seguimiento',
  'Pedido dañado',
];

// ============ Star Rating ============
const StarRating = ({
  rating,
  onRate,
  size = 38,
  label,
}: {
  rating: number;
  onRate: (rating: number) => void;
  size?: number;
  label?: string;
}) => {
  const ratingLabel =
    rating === 0
      ? 'Toca para calificar'
      : rating === 1
      ? 'Muy malo'
      : rating === 2
      ? 'Malo'
      : rating === 3
      ? 'Regular'
      : rating === 4
      ? 'Bueno'
      : 'Excelente';

  return (
    <View style={styles.starContainer}>
      {label && <Text style={styles.starLabel}>{label}</Text>}
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onRate(star)}
            style={styles.starButton}
            activeOpacity={0.85}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={size}
              color={star <= rating ? colors.primary : colors.textFaint}
            />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.ratingText, rating > 0 && styles.ratingTextActive]}>
        {ratingLabel}
      </Text>
    </View>
  );
};

// ============ Tag Selector ============
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
      {tags.map((tag) => {
        const active = selectedTags.includes(tag);
        return (
          <TouchableOpacity
            key={tag}
            style={[styles.tag, active && styles.tagSelected]}
            onPress={() => onToggle(tag)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tagText, active && styles.tagTextSelected]}>{tag}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default function RateOrderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || {};

  const order = {
    id: orderId || '1',
    orderNumber: 'DVL-001234',
    restaurant: {
      id: '1',
      name: 'Tacos El Patrón',
      logo: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200',
    },
    driver: {
      id: '1',
      name: 'Carlos Martínez',
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
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async () => {
    if (restaurantRating === 0) {
      Alert.alert('Calificación requerida', 'Por favor califica al restaurante');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert(
        '¡Gracias por tu opinión!',
        'Tu calificación nos ayuda a mejorar el servicio',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar tu calificación. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Omitir calificación',
      'Puedes calificar este pedido más tarde desde tu historial',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Omitir', onPress: () => navigation.goBack() },
      ],
    );
  };

  const restaurantTags =
    restaurantRating >= 4 ? POSITIVE_TAGS : restaurantRating > 0 ? NEGATIVE_TAGS : [];
  const driverTags =
    driverRating >= 4 ? DRIVER_POSITIVE_TAGS : driverRating > 0 ? DRIVER_NEGATIVE_TAGS : [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ============ Header ============ */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>FEEDBACK</Text>
          <Text style={styles.headerTitle}>Calificar pedido</Text>
        </View>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.skipText}>Omitir</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
      >
        {/* ============ Order Info ============ */}
        <View style={styles.orderInfo}>
          <View style={styles.orderInfoIcon}>
            <Ionicons name="checkmark-done" size={22} color={colors.success} />
          </View>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.orderComplete}>Pedido completado</Text>
        </View>

        {/* ============ Restaurant Rating ============ */}
        <View style={styles.sectionWrap}>
          <Card variant="glass" padding={s.lg} borderRadius={radius['2xl']}>
            <View style={styles.entityHeader}>
              <Image source={{ uri: order.restaurant.logo }} style={styles.entityImage} />
              <View style={styles.entityInfo}>
                <Text style={styles.entityLabel}>RESTAURANTE</Text>
                <Text style={styles.entityName}>{order.restaurant.name}</Text>
              </View>
            </View>
            <StarRating
              rating={restaurantRating}
              onRate={setRestaurantRating}
              label="¿Cómo estuvo la comida?"
            />
            {restaurantTags.length > 0 && (
              <TagSelector
                tags={restaurantTags}
                selectedTags={selectedTags}
                onToggle={toggleTag}
                title="¿Qué te pareció?"
              />
            )}
          </Card>
        </View>

        {/* ============ Driver Rating ============ */}
        <View style={styles.sectionWrap}>
          <Card variant="glass" padding={s.lg} borderRadius={radius['2xl']}>
            <View style={styles.entityHeader}>
              <Image source={{ uri: order.driver.avatar }} style={styles.entityImage} />
              <View style={styles.entityInfo}>
                <Text style={styles.entityLabel}>REPARTIDOR</Text>
                <Text style={styles.entityName}>{order.driver.name}</Text>
              </View>
            </View>
            <StarRating
              rating={driverRating}
              onRate={setDriverRating}
              label="¿Cómo fue la entrega?"
            />
            {driverTags.length > 0 && (
              <TagSelector
                tags={driverTags}
                selectedTags={selectedTags}
                onToggle={toggleTag}
                title="¿Qué te pareció?"
              />
            )}
          </Card>
        </View>

        {/* ============ Recommend ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>RECOMENDACIÓN</Text>
          <Text style={styles.sectionTitle}>¿Recomendarías este restaurante?</Text>
          <View style={styles.recommendRow}>
            <TouchableOpacity
              style={[
                styles.recommendBtn,
                wouldRecommend === true && styles.recommendBtnYes,
              ]}
              onPress={() => setWouldRecommend(true)}
              activeOpacity={0.88}
            >
              <Ionicons
                name="thumbs-up"
                size={22}
                color={wouldRecommend === true ? colors.text : colors.success}
              />
              <Text
                style={[
                  styles.recommendText,
                  wouldRecommend === true && styles.recommendTextActive,
                ]}
              >
                Sí
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.recommendBtn,
                wouldRecommend === false && styles.recommendBtnNo,
              ]}
              onPress={() => setWouldRecommend(false)}
              activeOpacity={0.88}
            >
              <Ionicons
                name="thumbs-down"
                size={22}
                color={wouldRecommend === false ? colors.text : colors.textMuted}
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

        {/* ============ Comment ============ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionEyebrow}>OPCIONAL</Text>
          <Text style={styles.sectionTitle}>Comentario adicional</Text>
          <Input
            variant="filled"
            placeholder="Cuéntanos más sobre tu experiencia…"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
            containerStyle={styles.commentBox}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>
      </ScrollView>

      {/* ============ Floating CTA ============ */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          <Text style={styles.submitText}>
            {isSubmitting ? 'ENVIANDO…' : 'ENVIAR CALIFICACIÓN'}
          </Text>
          {!isSubmitting && (
            <Ionicons name="send" size={18} color={colors.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ HEADER ============
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s.md,
    height: 56,
    gap: s.sm,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
  },

  // ============ ORDER INFO ============
  orderInfo: {
    alignItems: 'center',
    paddingVertical: s.xl,
  },
  orderInfoIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(31,174,111,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(31,174,111,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s.sm,
  },
  orderNumber: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  orderComplete: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // ============ SECTIONS ============
  sectionWrap: {
    paddingHorizontal: s.xl,
    marginBottom: s.lg,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: s.md,
  },

  // ============ ENTITY ============
  entityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginBottom: s.lg,
  },
  entityImage: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  entityInfo: { flex: 1 },
  entityLabel: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  entityName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
    marginTop: 2,
  },

  // ============ STARS ============
  starContainer: {
    alignItems: 'center',
    paddingVertical: s.xs,
  },
  starLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    marginBottom: s.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: s.xs,
  },
  starButton: {
    padding: 2,
  },
  ratingText: {
    color: colors.textFaint,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: s.md,
  },
  ratingTextActive: {
    color: colors.primary,
  },

  // ============ TAGS ============
  tagSection: {
    marginTop: s.lg,
    paddingTop: s.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tagTitle: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
    letterSpacing: 0.3,
    marginBottom: s.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
  },
  tag: {
    paddingHorizontal: s.md,
    paddingVertical: s.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagSelected: {
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderColor: colors.primary,
  },
  tagText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  tagTextSelected: {
    color: colors.primary,
    fontWeight: fontWeight.heavy,
  },

  // ============ RECOMMEND ============
  recommendRow: {
    flexDirection: 'row',
    gap: s.sm,
  },
  recommendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: s.xs,
  },
  recommendBtnYes: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  recommendBtnNo: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  recommendText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: 0.3,
  },
  recommendTextActive: {
    color: colors.text,
  },

  // ============ COMMENT ============
  commentBox: {
    minHeight: 100,
  },
  charCount: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    textAlign: 'right',
    marginTop: s.xs,
  },

  // ============ FOOTER ============
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: s.xl,
    paddingTop: s.md,
    paddingBottom: s['2xl'],
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.sm,
    ...shadows.glow,
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },
});
