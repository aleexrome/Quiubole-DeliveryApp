// ==========================================
// RESTAURANT DETAIL SCREEN - MENU DEL RESTAURANTE
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useCartStore } from '../../store/cartStore';
import { Restaurant, Product, ProductOption, SelectedOption } from '../../types';

const { width, height } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 250;
const HEADER_MIN_HEIGHT = 100;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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
};

// Datos mock de productos
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    restaurantId: '1',
    name: 'Tacos al Pastor',
    description: 'Tacos de cerdo adobado con pina, cebolla y cilantro. Servidos con salsa roja y verde.',
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
          { id: 'c1', name: 'Maiz', price: 0 },
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
    description: 'Totopos con queso, frijoles, jalape-os, crema y guacamole',
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

// Componente de producto
const ProductCard = ({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) => (
  <TouchableOpacity style={styles.productCard} onPress={onPress}>
    <View style={styles.productInfo}>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
      <View style={styles.productFooter}>
        <Text style={styles.productPrice}>${product.price}</Text>
        {!product.isAvailable && (
          <Text style={styles.unavailableText}>No disponible</Text>
        )}
      </View>
    </View>
    <Image source={{ uri: product.image }} style={styles.productImage} />
    <TouchableOpacity style={styles.addButton} onPress={onPress}>
      <Ionicons name="add" size={20} color={COLORS.white} />
    </TouchableOpacity>
  </TouchableOpacity>
);

// Modal de opciones de producto
const ProductOptionsModal = ({
  visible,
  product,
  onClose,
  onAddToCart,
}: {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, options: SelectedOption[], instructions: string) => void;
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

  const handleOptionSelect = (option: ProductOption, choice: { id: string; name: string; price: number }) => {
    if (option.type === 'single') {
      // Radio button - reemplazar seleccion
      setSelectedOptions(prev => {
        const filtered = prev.filter(o => o.optionId !== option.id);
        return [...filtered, { optionId: option.id, optionName: option.name, choiceId: choice.id, choiceName: choice.name, price: choice.price }];
      });
    } else {
      // Checkbox - toggle
      setSelectedOptions(prev => {
        const exists = prev.find(o => o.optionId === option.id && o.choiceId === choice.id);
        if (exists) {
          return prev.filter(o => !(o.optionId === option.id && o.choiceId === choice.id));
        } else {
          return [...prev, { optionId: option.id, optionName: option.name, choiceId: choice.id, choiceName: choice.name, price: choice.price }];
        }
      });
    }
  };

  const isOptionSelected = (optionId: string, choiceId: string) => {
    return selectedOptions.some(o => o.optionId === optionId && o.choiceId === choiceId);
  };

  const calculateTotal = () => {
    const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0);
    return (product.price + optionsTotal) * quantity;
  };

  const handleAdd = () => {
    // Validar opciones requeridas
    const requiredOptions = product.options?.filter(o => o.required) || [];
    for (const opt of requiredOptions) {
      if (!selectedOptions.some(s => s.optionId === opt.id)) {
        Alert.alert('Opcion requerida', `Por favor selecciona ${opt.name}`);
        return;
      }
    }
    onAddToCart(product, quantity, selectedOptions, instructions);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Image source={{ uri: product.image }} style={styles.modalImage} />
              <TouchableOpacity style={styles.modalClose} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Info */}
            <View style={styles.modalInfo}>
              <Text style={styles.modalTitle}>{product.name}</Text>
              <Text style={styles.modalDescription}>{product.description}</Text>
              <Text style={styles.modalPrice}>${product.price}</Text>
            </View>

            {/* Options */}
            {product.options?.map(option => (
              <View key={option.id} style={styles.optionSection}>
                <View style={styles.optionHeader}>
                  <Text style={styles.optionTitle}>{option.name}</Text>
                  {option.required && <Text style={styles.requiredBadge}>Requerido</Text>}
                </View>
                <Text style={styles.optionSubtitle}>
                  {option.type === 'single' ? 'Selecciona una opcion' : 'Selecciona las que quieras'}
                </Text>
                {option.choices.map(choice => (
                  <TouchableOpacity
                    key={choice.id}
                    style={styles.choiceRow}
                    onPress={() => handleOptionSelect(option, choice)}
                  >
                    <View style={styles.choiceInfo}>
                      <Ionicons
                        name={isOptionSelected(option.id, choice.id)
                          ? (option.type === 'single' ? 'radio-button-on' : 'checkbox')
                          : (option.type === 'single' ? 'radio-button-off' : 'square-outline')
                        }
                        size={22}
                        color={isOptionSelected(option.id, choice.id) ? COLORS.primary : COLORS.gray}
                      />
                      <Text style={styles.choiceName}>{choice.name}</Text>
                    </View>
                    {choice.price > 0 && (
                      <Text style={styles.choicePrice}>+${choice.price}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Special Instructions */}
            <View style={styles.instructionsSection}>
              <Text style={styles.optionTitle}>Instrucciones especiales</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Ej: Sin cebolla, extra salsa..."
                placeholderTextColor={COLORS.gray}
                value={instructions}
                onChangeText={setInstructions}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Quantity */}
            <View style={styles.quantitySection}>
              <Text style={styles.optionTitle}>Cantidad</Text>
              <View style={styles.quantityControl}>
                <TouchableOpacity
                  style={[styles.quantityBtn, quantity <= 1 && styles.quantityBtnDisabled]}
                  onPress={() => quantity > 1 && setQuantity(q => q - 1)}
                >
                  <Ionicons name="remove" size={20} color={quantity <= 1 ? COLORS.gray : COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityBtn}
                  onPress={() => setQuantity(q => q + 1)}
                >
                  <Ionicons name="add" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Add to Cart Button */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.addToCartButton} onPress={handleAdd}>
              <Text style={styles.addToCartText}>Agregar al carrito</Text>
              <Text style={styles.addToCartPrice}>${calculateTotal().toFixed(2)}</Text>
            </TouchableOpacity>
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

  const { addItem, setRestaurant, itemCount, restaurant: cartRestaurant } = useCartStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Agrupar productos por categoria
  const categories = [...new Set(products.map(p => p.category))];
  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat] = products.filter(p => p.category === cat);
    return acc;
  }, {} as Record<string, Product[]>);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const handleProductPress = (product: Product) => {
    if (!product.isAvailable) {
      Alert.alert('No disponible', 'Este producto no esta disponible por el momento');
      return;
    }
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleAddToCart = (product: Product, quantity: number, options: SelectedOption[], instructions: string) => {
    // Verificar si hay items de otro restaurante
    if (cartRestaurant && cartRestaurant.id !== restaurant.id) {
      Alert.alert(
        'Cambiar restaurante?',
        `Tu carrito tiene productos de ${cartRestaurant.name}. Quieres vaciarlo y agregar de ${restaurant.name}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Si, cambiar',
            onPress: () => {
              setRestaurant(restaurant);
              addItem(product, quantity, options, instructions);
              Alert.alert('Agregado', `${quantity}x ${product.name} agregado al carrito`);
            },
          },
        ]
      );
    } else {
      if (!cartRestaurant) {
        setRestaurant(restaurant);
      }
      addItem(product, quantity, options, instructions);
      Alert.alert('Agregado', `${quantity}x ${product.name} agregado al carrito`);
    }
  };

  const handleGoToCart = () => {
    navigation.navigate('Cart');
  };

  return (
    <View style={styles.container}>
      {/* Animated Header */}
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <Animated.Image
          source={{ uri: restaurant.coverImage }}
          style={[styles.headerImage, { opacity: headerOpacity }]}
        />
        <View style={styles.headerOverlay} />
        <SafeAreaView style={styles.headerContent}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="heart-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="share-outline" size={24} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: HEADER_MAX_HEIGHT }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Restaurant Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Image source={{ uri: restaurant.logo }} style={styles.logo} />
            <View style={styles.infoContent}>
              <Text style={styles.restaurantName}>{restaurant.name}</Text>
              <Text style={styles.category}>{restaurant.category}</Text>
            </View>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color={COLORS.star} />
              <Text style={styles.rating}>{restaurant.rating}</Text>
              <Text style={styles.reviews}>({restaurant.totalReviews})</Text>
            </View>
          </View>
          <Text style={styles.description}>{restaurant.description}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>{restaurant.deliveryTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="bicycle-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>${restaurant.deliveryFee} envio</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="cart-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>Min ${restaurant.minimumOrder}</Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        {categories.map(category => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {productsByCategory[category].map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product)}
              />
            ))}
          </View>
        ))}

        <View style={{ height: 120 }} />
      </Animated.ScrollView>

      {/* Cart Footer */}
      {itemCount > 0 && (
        <View style={styles.cartFooter}>
          <TouchableOpacity style={styles.viewCartButton} onPress={handleGoToCart}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount}</Text>
            </View>
            <Text style={styles.viewCartText}>Ver carrito</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    marginTop: -20,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  category: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 4,
  },
  reviews: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 2,
  },
  description: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  categorySection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  productDescription: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    lineHeight: 16,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  unavailableText: {
    fontSize: 11,
    color: COLORS.gray,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartFooter: {
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
  viewCartButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  cartBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  viewCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    position: 'relative',
  },
  modalImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    lineHeight: 20,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 8,
  },
  optionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  requiredBadge: {
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    marginBottom: 12,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  choiceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceName: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 12,
  },
  choicePrice: {
    fontSize: 14,
    color: COLORS.gray,
  },
  instructionsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  instructionsInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quantitySection: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 4,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginHorizontal: 16,
  },
  modalFooter: {
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
  addToCartButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  addToCartText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  addToCartPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
});
