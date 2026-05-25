// ==========================================
// TIPOS PRINCIPALES DE QUIUBOLE
// ==========================================

// Roles de usuario
export type UserRole =
  | 'customer'
  | 'client' // alias backend (default al registrarse)
  | 'restaurant'
  | 'merchant' // alias backend (legacy)
  | 'driver'
  | 'editor' // staff de Devolón que edita menús/fotos/precios
  | 'admin';

// Estado del usuario (para repartidores)
export type DriverStatus = 'offline' | 'online' | 'busy';

// Estados de pedido
export type OrderStatus =
  | 'pending'           // Cliente hizo el pedido
  | 'confirmed'         // Restaurante confirmó
  | 'preparing'         // Restaurante preparando
  | 'ready_for_pickup'  // Listo para recoger
  | 'driver_assigned'   // Repartidor asignado
  | 'picked_up'         // Repartidor recogió
  | 'on_the_way'        // En camino
  | 'delivered'         // Entregado
  | 'cancelled';        // Cancelado

// Usuario base
export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  // Aprobación por admin. Aplica a driver/restaurant/editor. customer y
  // admin se auto-aprueban en el registro. Mientras false, el AppNavigator
  // redirige al user a la pantalla "Cuenta en revisión".
  isApproved?: boolean;
  isActive?: boolean;
  rejectionReason?: string | null;
  createdAt: Date;
}

// Cliente
export interface Customer extends User {
  role: 'customer';
  addresses: Address[];
  favoriteRestaurants: string[];
  paymentMethods: PaymentMethod[];
}

// Restaurante/Negocio
export interface Restaurant {
  id: string;
  ownerId: string;  // Usuario dueño
  name: string;
  description: string;
  logo: string;
  coverImage: string;
  address: Address;
  phone: string;
  email: string;
  category: string;
  rating: number;
  totalReviews: number;
  isActive: boolean;
  isApproved: boolean;  // Admin debe aprobar
  openingHours: OpeningHours[];
  deliveryTime: string; // "30-45 min"
  deliveryFee: number;
  minimumOrder: number;
  createdAt: Date;
}

// Repartidor
export interface Driver extends User {
  role: 'driver';
  status: DriverStatus;
  vehicleType: 'bicycle' | 'motorcycle' | 'car';
  vehiclePlate?: string;
  currentLocation?: Location;
  rating: number;
  totalDeliveries: number;
  earnings: DriverEarnings;
  documents: DriverDocuments;
  isApproved: boolean;  // Admin debe aprobar
}

// Documentos del repartidor
export interface DriverDocuments {
  idCard: string;       // INE
  driverLicense?: string;
  vehicleCard?: string;
  proofOfAddress: string;
  criminalRecord: string;
}

// Ganancias del repartidor
export interface DriverEarnings {
  today: number;
  thisWeek: number;
  thisMonth: number;
  total: number;
  pendingPayout: number;
}

// Producto
export interface Product {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;  // Para descuentos
  image: string;
  category: string;
  isAvailable: boolean;
  isApproved: boolean;  // Admin aprueba
  preparationTime: number; // minutos
  options?: ProductOption[];
  createdAt: Date;
  updatedAt: Date;
}

// Opciones de producto (extras, tamaños, etc)
export interface ProductOption {
  id: string;
  name: string;
  type: 'single' | 'multiple';  // Radio o checkbox
  required: boolean;
  choices: ProductChoice[];
}

export interface ProductChoice {
  id: string;
  name: string;
  price: number;
}

// Pedido
export interface Order {
  id: string;
  orderNumber: string;  // QUB-001234
  customerId: string;
  customer: Customer;
  restaurantId: string;
  restaurant: Restaurant;
  driverId?: string;
  driver?: Driver;
  items: OrderItem[];
  status: OrderStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  discount: number;
  tip: number;
  total: number;
  paymentMethod: 'card' | 'cash' | 'paypal';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryAddress: Address;
  specialInstructions?: string;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Timestamps de cada estado
  confirmedAt?: Date;
  preparingAt?: Date;
  readyAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  selectedOptions?: SelectedOption[];
  specialInstructions?: string;
}

export interface SelectedOption {
  optionId: string;
  optionName: string;
  choiceId: string;
  choiceName: string;
  price: number;
}

// Dirección
export interface Address {
  id: string;
  label: string;  // "Casa", "Trabajo"
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  reference?: string;
  location: Location;
  isDefault: boolean;
}

// Ubicación GPS
export interface Location {
  latitude: number;
  longitude: number;
}

// Método de pago
export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;  // "visa", "mastercard"
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

// Horarios de apertura
export interface OpeningHours {
  dayOfWeek: number;  // 0 = Domingo, 6 = Sábado
  openTime: string;   // "09:00"
  closeTime: string;  // "22:00"
  isClosed: boolean;
}

// Review/Calificación
export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customer: Customer;
  restaurantId?: string;
  driverId?: string;
  rating: number;  // 1-5
  comment?: string;
  response?: string;  // Respuesta del restaurante
  createdAt: Date;
}

// Cupón
export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableRestaurants?: string[];  // IDs, vacío = todos
}

// Notificación
export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'order' | 'promotion' | 'system';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

// Para verificación de email/teléfono
export interface VerificationCode {
  id: string;
  userId: string;
  type: 'email' | 'phone';
  code: string;
  expiresAt: Date;
  isUsed: boolean;
}

// Estadísticas para Admin
export interface AdminStats {
  totalOrders: number;
  totalRevenue: number;
  activeUsers: number;
  activeDrivers: number;
  activeRestaurants: number;
  ordersToday: number;
  revenueToday: number;
  averageOrderValue: number;
  averageDeliveryTime: number;
}
