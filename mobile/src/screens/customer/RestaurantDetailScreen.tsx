// ==========================================
// DEVOLÓN — Restaurant Detail
//
// Hero cinematográfico edge-to-edge con cover image + back/heart flotantes,
// info card glass con logo + rating, menú agrupado por categoría con cards
// glass, CTA flotante inferior "Ver carrito" con badge amarillo. Modal de
// opciones del producto en bottom sheet dark con stepper y CTA primario.
// ==========================================

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCartStore } from '../../store/cartStore';
import { Restaurant, Product, ProductOption, SelectedOption } from '../../types';
import { Button, Card } from '../../components/ui';
import {
  colors,
  s,
  radius,
  shadows,
  fontSize,
  fontWeight,
  tracking,
} from '../../theme';

const { height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 260;
const HEADER_MIN_HEIGHT = 96;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

// ============ Mock products ============
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    restaurantId: '1',
    name: 'Tacos al Pastor',
    description: 'Tacos de cerdo adobado con piña, cebolla y cilantro. Servidos con salsa roja y verde.',
    price: 45,
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400',
    category: 'Tacos',
    isAvailable: true,
    isApproved: true,
    preparationTime: 15,
    options: [
      {
        id: 'opt1',
        name: 'Tipo de tortilla',
        type: 'single',
        required: true,
        choices: [
          { id: 'c1', name: 'Maíz', price: 0 },
          { id: 'c2', name: 'Harina', price: 5 },
        ],
      },
      {
        id: 'opt2',
        name: 'Extras',
        type: 'multiple',
        required: false,
        choices: [
          { id: 'c3', name: 'Queso extra', price: 15 },
          { id: 'c4', name: 'Guacamole', price: 20 },
          { id: 'c5', name: 'Cebolla asada', price: 10 },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    restaurantId: '1',
    name: 'Tacos de Bistec',
    description: 'Jugosos tacos de res con cebolla caramelizada',
    price: 50,
    image: 'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=400',
    category: 'Tacos',
    isAvailable: true,
    isApproved: true,
    preparationTime: 15,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    restaurantId: '1',
    name: 'Quesadilla de Queso',
    description: 'Tortilla de harina rellena de queso Oaxaca derretido',
    price: 35,
    image: 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400',
    category: 'Quesadillas',
    isAvailable: true,
    isApproved: true,
    preparationTime: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    restaurantId: '1',
    name: 'Agua de Horchata',
    description: 'Refrescante agua de arroz con canela',
    price: 25,
    image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
    category: 'Bebidas',
    isAvailable: true,
    isApproved: true,
    preparationTime: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    restaurantId: '1',
    name: 'Orden de Nachos',
    description: 'Totopos con queso, frijoles, jalapeños, crema y guacamole',
    price: 85,
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400',
    category: 'Entradas',
    isAvailable: true,
    isApproved: true,
    preparationTime: 12,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// ============ Product Card ============
const ProductCard = ({ product, onPress }: { product: Product; onPress: () => void }) => (
  <Card
    variant="glass"
    onPress={onPress}
    padding={s.md}
    borderRadius={radius.xl}
    style={styles.productCard}
  >
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
      <Text style={styles.productDescription} numberOfLines={2}>
        {product.description}
      </Text>
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>${product.price}</Text>
        {!product.isAvailable && (
          <Text style={styles.unavailableText}>No disponible</Text>
        )}
      </View>
    </View>
    <View style={styles.productImageWrap}>
      <Image source={{ uri: product.image }} style={styles.productImage} />
      <View style={styles.productAddBtn}>
        <Ionicons name="add" size={18} color={colors.onPrimary} />
      </View>
    </View>
  </Card>
);

// ============ Product Options Modal ============
const ProductOptionsModal = ({
  visible,
  product,
  onClose,
  onAddToCart,
}: {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    options: SelectedOption[],
    instructions: string,
  ) => void;
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [instructions, setInstructions] = useState('');

  useEffect(() => {
    if (visible) {
      setQuantity(1);
      setSelectedOptions([]);
      setInstructions('');
    }
  }, [visible]);

  if (!product) return null;

  const handleOptionSelect = (
    option: ProductOption,
    choice: { id: string; name: string; price: number },
  ) => {
    if (option.type === 'single') {
      setSelectedOptions((prev) => {
        const filtered = prev.filter((o) => o.optionId !== option.id);
        return [
          ...filtered,
          {
            optionId: option.id,
            optionName: option.name,
            choiceId: choice.id,
            choiceName: choice.name,
            price: choice.price,
          },
        ];
      });
    } else {
      setSelectedOptions((prev) => {
        const exists = prev.find(
          (o) => o.optionId === option.id && o.choiceId === choice.id,
        );
        if (exists) {
          return prev.filter(
            (o) => !(o.optionId === option.id && o.choiceId === choice.id),
          );
        }
        return [
          ...prev,
          {
            optionId: option.id,
            optionName: option.name,
            choiceId: choice.id,
            choiceName: choice.name,
            price: choice.price,
          },
        ];
      });
    }
  };

  const isOptionSelected = (optionId: string, choiceId: string) =>
    selectedOptions.some((o) => o.optionId === optionId && o.choiceId === choiceId);

  const calculateTotal = () => {
    const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0);
    return (product.price + optionsTotal) * quantity;
  };

  const handleAdd = () => {
    const requiredOptions = product.options?.filter((o) => o.required) || [];
    for (const opt of requiredOptions) {
      if (!selectedOptions.some((sel) => sel.optionId === opt.id)) {
        Alert.alert('Opción requerida', `Por favor selecciona ${opt.name}`);
        return;
      }
    }
    onAddToCart(product, quantity, selectedOptions, instructions);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <Image source={{ uri: product.image }} style={styles.modalImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.modalImageGradient}
              />
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalInfo}>
              <Text style={styles.modalEyebrow}>{product.category.toUpperCase()}</Text>
              <Text style={styles.modalTitle}>{product.name}</Text>
              <Text style={styles.modalDescription}>{product.description}</Text>
              <Text style={styles.modalPrice}>${product.price}</Text>
            </View>

            {product.options?.map((option) => (
              <View key={option.id} style={styles.optionSection}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>{option.name}</Text>
                  {option.required && (
                    <View style={styles.requiredBadge}>
                      <Text style={styles.requiredBadgeText}>REQUERIDO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.optionSubtitle}>
                  {option.type === 'single'
                    ? 'Selecciona una opción'
                    : 'Selecciona las que quieras'}
                </Text>
                {option.choices.map((choice) => {
                  const selected = isOptionSelected(option.id, choice.id);
                  return (
                    <TouchableOpacity
                      key={choice.id}
                      style={styles.choiceRow}
                      onPress={() => handleOptionSelect(option, choice)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.choiceInfo}>
                        <Ionicons
                          name={
                            selected
                              ? option.type === 'single'
                                ? 'radio-button-on'
                                : 'checkbox'
                              : option.type === 'single'
                              ? 'radio-button-off'
                              : 'square-outline'
                          }
                          size={22}
                          color={selected ? colors.primary : colors.textFaint}
                        />
                        <Text style={styles.choiceName}>{choice.name}</Text>
                      </View>
                      {choice.price > 0 && (
                        <Text style={styles.choicePrice}>+${choice.price}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <View style={styles.optionSection}>
              <Text style={styles.optionTitle}>Instrucciones especiales</Text>
              <Text style={styles.optionSubtitle}>Opcional</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Ej: Sin cebolla, extra salsa…"
                placeholderTextColor={colors.textFaint}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
                selectionColor={colors.primary}
              />
            </View>

            <View style={styles.quantitySection}>
              <Text style={styles.optionTitle}>Cantidad</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={[styles.quantityBtn, quantity <= 1 && styles.quantityBtnDisabled]}
                  onPress={() => quantity > 1 && setQuantity((q) => q - 1)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="remove"
                    size={18}
                    color={quantity <= 1 ? colors.textFaint : colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQuantity((q) => q + 1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>

          <View style={styles.modalFooter}>
            <Button
              label={`AGREGAR · $${calculateTotal().toFixed(2)}`}
              onPress={handleAdd}
              icon="cart"
              iconPosition="left"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function RestaurantDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { restaurant } = route.params as { restaurant: Restaurant };

  const {
    addItem,
    setRestaurant,
    itemCount,
    restaurant: cartRestaurant,
  } = useCartStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const categories = [...new Set(products.map((p) => p.category))];
  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = products.filter((p) => p.category === cat);
    return acc;
  }, {} as Record<string, Product[]>);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0.15],
    extrapolate: 'clamp',
  });

  const handleProductPress = (product: Product) => {
    if (!product.isAvailable) {
      Alert.alert('No disponible', 'Este producto no está disponible por el momento');
      return;
    }
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleAddToCart = (
    product: Product,
    quantity: number,
    options: SelectedOption[],
    instructions: string,
  ) => {
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      Alert.alert(
        '¿Cambiar restaurante?',
        `Tu carrito tiene productos de ${cartRestaurant.name}. ¿Quieres vaciarlo y agregar de ${restaurant.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, cambiar',
            onPress: () => {
              setRestaurant(restaurant);
              addItem(product, quantity, options, instructions);
              Alert.alert('Agregado', `${quantity}× ${product.name} agregado al carrito`);
            },
          },
        ],
      );
    } else {
      if (!cartRestaurant) setRestaurant(restaurant);
      addItem(product, quantity, options, instructions);
      Alert.alert('Agregado', `${quantity}× ${product.name} agregado al carrito`);
    }
  };

  const handleGoToCart = () => navigation.navigate('Cart');

  return (
    <View style={styles.container}>
      {/* ============ Animated Hero ============ */}
      <Animated.View style={[styles.heroContainer, { height: headerHeight }]}>
        <Animated.Image
          source={{ uri: restaurant.coverImage }}
          style={[styles.heroImage, { opacity: headerOpacity }]}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', colors.bg]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <SafeAreaView style={styles.heroOverlay} edges={['top']}>
          <TouchableOpacity
            style={styles.heroIconBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroIconBtn} activeOpacity={0.85}>
              <Ionicons name="heart-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroIconBtn} activeOpacity={0.85}>
              <Ionicons name="share-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* ============ Content ============ */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT - 32, paddingBottom: 140 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Restaurant Info Card */}
        <View style={styles.infoWrap}>
          <Card variant="glass" padding={s.lg} borderRadius={radius['2xl']}>
            <View style={styles.infoHeader}>
              <Image source={{ uri: restaurant.logo }} style={styles.logo} />
              <View style={styles.infoContent}>
                <Text style={styles.eyebrow}>{restaurant.category.toUpperCase()}</Text>
                <Text style={styles.restaurantName} numberOfLines={1}>
                  {restaurant.name}
                </Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={12} color={colors.primary} />
                  <Text style={styles.ratingText}>{restaurant.rating}</Text>
                  <Text style={styles.reviewsText}>
                    ({restaurant.totalReviews} reseñas)
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.description}>{restaurant.description}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="time-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="bicycle-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>${restaurant.deliveryFee} envío</Text>
              </View>
              <View style={styles.metaPill}>
                <Ionicons name="cart-outline" size={11} color={colors.textMuted} />
                <Text style={styles.metaText}>Mín ${restaurant.minimumOrder}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Menu */}
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.sectionEyebrow}>MENÚ</Text>
            <Text style={styles.categoryTitle}>{category}</Text>
            {productsByCategory[category].map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product)}
              />
            ))}
          </View>
        ))}
      </Animated.ScrollView>

      {/* ============ Floating Cart CTA ============ */}
      {itemCount > 0 && (
        <View style={styles.cartFooter}>
          <TouchableOpacity
            style={styles.cartCTA}
            onPress={handleGoToCart}
            activeOpacity={0.88}
          >
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.cartCTAText}>VER CARRITO</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Product Options Modal */}
      <ProductOptionsModal
        visible={modalVisible}
        product={selectedProduct}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // ============ HERO ============
  heroContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
    backgroundColor: colors.bg,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: s.md,
    paddingTop: s.xs,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroActions: {
    flexDirection: 'row',
    gap: s.xs,
  },

  scrollView: { flex: 1 },

  // ============ INFO CARD ============
  infoWrap: {
    paddingHorizontal: s.xl,
    marginBottom: s.xl,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoContent: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wider,
  },
  restaurantName: {
    color: colors.text,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  ratingText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.heavy,
  },
  reviewsText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginLeft: 2,
  },
  description: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: 18,
    marginTop: s.md,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s.xs,
    marginTop: s.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },

  // ============ CATEGORY SECTION ============
  categorySection: {
    paddingHorizontal: s.xl,
    marginBottom: s.xl,
  },
  sectionEyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
    textTransform: 'uppercase',
  },
  categoryTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.3,
    marginTop: 2,
    marginBottom: s.md,
  },

  // ============ PRODUCT CARD ============
  productCard: {
    flexDirection: 'row',
    gap: s.md,
    marginBottom: s.xs,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  productDescription: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginTop: 4,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s.xs,
  },
  productPrice: {
    color: colors.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    letterSpacing: -0.2,
  },
  unavailableText: {
    color: colors.textFaint,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    fontStyle: 'italic',
    marginLeft: s.xs,
  },
  productImageWrap: {
    position: 'relative',
  },
  productImage: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
  },
  productAddBtn: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
    ...shadows.glow,
  },

  // ============ FLOATING CART CTA ============
  cartFooter: {
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
  cartCTA: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.sm,
    paddingHorizontal: s.lg,
    ...shadows.glow,
  },
  cartBadge: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.onPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.black,
  },
  cartCTAText: {
    color: colors.onPrimary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.widest,
  },

  // ============ MODAL ============
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bgRaised,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    maxHeight: height * 0.9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
  },
  modalImageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: s.md,
    right: s.md,
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: s.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.widest,
  },
  modalTitle: {
    color: colors.text,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.6,
    marginTop: 4,
  },
  modalDescription: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    marginTop: s.xs,
    lineHeight: 20,
  },
  modalPrice: {
    color: colors.primary,
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.black,
    letterSpacing: -0.4,
    marginTop: s.md,
  },
  optionSection: {
    paddingHorizontal: s.xl,
    paddingVertical: s.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.xs,
  },
  optionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.heavy,
    letterSpacing: -0.2,
  },
  requiredBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,194,14,0.12)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  requiredBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: fontWeight.black,
    letterSpacing: tracking.wider,
  },
  optionSubtitle: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
    marginBottom: s.sm,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: s.sm,
  },
  choiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
  },
  choiceName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  choicePrice: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.heavy,
  },
  instructionsInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: s.md,
    marginTop: s.xs,
    fontSize: fontSize.md,
    color: colors.text,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  quantitySection: {
    paddingHorizontal: s.xl,
    paddingVertical: s.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    padding: 4,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnDisabled: {
    opacity: 0.4,
  },
  quantityValue: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.black,
    minWidth: 36,
    textAlign: 'center',
  },
  modalFooter: {
    padding: s.xl,
    paddingBottom: s['2xl'],
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bgRaised,
  },
});
