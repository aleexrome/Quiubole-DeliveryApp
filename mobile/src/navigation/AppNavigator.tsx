// ==========================================
// DEVOLÓN — Navegación principal con roles
//
// Theme global aplicado al NavigationContainer (evita flash blanco en
// transiciones), tab bars y headers nativos. Toda config visual sale
// de los tokens del theme — no hardcodear colores aquí.
// ==========================================

import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  type Theme as NavTheme,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import {
  createBottomTabNavigator,
  type BottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { linking } from '../config/linking';
import { colors, fontWeight, fontSize, tracking } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import PendingApprovalScreen from '../screens/auth/PendingApprovalScreen';

// Customer Screens
import CustomerHomeScreen from '../screens/customer/HomeScreen';
import CustomerSearchScreen from '../screens/customer/SearchScreen';
import CustomerOrdersScreen from '../screens/customer/OrdersScreen';
import CustomerProfileScreen from '../screens/customer/ProfileScreen';
import RestaurantDetailScreen from '../screens/customer/RestaurantDetailScreen';
import CartScreen from '../screens/customer/CartScreen';
import CheckoutScreen from '../screens/customer/CheckoutScreen';
import OrderTrackingScreen from '../screens/customer/OrderTrackingScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import RateOrderScreen from '../screens/customer/RateOrderScreen';
import ChatbotScreen from '../screens/customer/ChatbotScreen';
import FavoritesScreen from '../screens/customer/FavoritesScreen';
import QuiuPointsScreen from '../screens/customer/QuiuPointsScreen';
import GroupOrderScreen from '../screens/customer/GroupOrderScreen';
import ScheduleOrderScreen from '../screens/customer/ScheduleOrderScreen';
import SurpriseMeScreen from '../screens/customer/SurpriseMeScreen';
import StoriesScreen from '../screens/customer/StoriesScreen';
import LiveChatScreen from '../screens/customer/LiveChatScreen';

// Restaurant Screens
import RestaurantDashboardScreen from '../screens/restaurant/DashboardScreen';
import RestaurantOrdersScreen from '../screens/restaurant/OrdersScreen';
import RestaurantMenuScreen from '../screens/restaurant/MenuScreen';
import RestaurantStatsScreen from '../screens/restaurant/StatsScreen';
import RestaurantProfileScreen from '../screens/restaurant/ProfileScreen';
import OrderDetailScreen from '../screens/restaurant/OrderDetailScreen';
import ProductEditScreen from '../screens/restaurant/ProductEditScreen';
import RestaurantHoursScreen from '../screens/restaurant/HoursScreen';
import RestaurantAddressScreen from '../screens/restaurant/AddressScreen';
import RestaurantPaymentsScreen from '../screens/restaurant/PaymentsScreen';
import RestaurantNotificationsScreen from '../screens/restaurant/NotificationsScreen';
import RestaurantSupportScreen from '../screens/restaurant/SupportScreen';

// Driver Screens
import DriverHomeScreen from '../screens/driver/HomeScreen';
import DriverDeliveriesScreen from '../screens/driver/DeliveriesScreen';
import DriverEarningsScreen from '../screens/driver/EarningsScreen';
import DriverProfileScreen from '../screens/driver/ProfileScreen';
import ActiveDeliveryScreen from '../screens/driver/ActiveDeliveryScreen';
import AvailableOrdersScreen from '../screens/driver/AvailableOrdersScreen';
import DriverVehicleScreen from '../screens/driver/VehicleScreen';
import DriverProfileEditScreen from '../screens/driver/ProfileEditScreen';
import CustomerProfileEditScreen from '../screens/customer/ProfileEditScreen';
import CustomerAddressesScreen from '../screens/customer/AddressesScreen';
import CustomerAddressEditScreen from '../screens/customer/AddressEditScreen';

// Shared
import ChatScreen from '../screens/shared/ChatScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import AdminUsersScreen from '../screens/admin/UsersScreen';
import AdminRestaurantsScreen from '../screens/admin/RestaurantsScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import AdminDriversScreen from '../screens/admin/DriversScreen';
import AdminDevoCouponsScreen from '../screens/admin/DevoCouponsScreen';
import AdminProductsScreen from '../screens/admin/ProductsScreen';
import AdminSettingsScreen from '../screens/admin/SettingsScreen';
import AdminEditorsScreen from '../screens/admin/EditorsScreen';
import AdminFinanceScreen from '../screens/admin/FinanceScreen';

// Editor Screens
import EditorRestaurantsListScreen from '../screens/editor/EditorRestaurantsListScreen';
import EditorMenuScreen from '../screens/editor/EditorMenuScreen';
import EditorProductEditScreen from '../screens/editor/EditorProductEditScreen';
import EditorRestaurantEditScreen from '../screens/editor/EditorRestaurantEditScreen';
import EditorProfileScreen from '../screens/editor/EditorProfileScreen';
import EditorProfileEditScreen from '../screens/editor/EditorProfileEditScreen';
import EditorChatsScreen from '../screens/editor/EditorChatsScreen';
import EditorChatDetailScreen from '../screens/editor/EditorChatDetailScreen';

// Legal Screens
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// THEME GLOBAL DE NAVEGACIÓN
// ==========================================

/** Theme oficial Devolón para @react-navigation. Evita flash blanco. */
const navTheme: NavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.border,
    notification: colors.primary,
  },
};

/** Defaults compartidos por TODAS las tabs (todos los roles). */
const tabScreenOptions: BottomTabNavigationOptions = {
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: {
    backgroundColor: colors.bg,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 84 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
  },
  tabBarLabelStyle: {
    fontSize: fontSize.xxs,
    fontWeight: fontWeight.heavy,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase',
  },
  tabBarItemStyle: { paddingVertical: 4 },
  headerShown: false,
};

/** Defaults para headers nativos del Stack (cuando headerShown:true). */
const nativeStackHeaderOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.heavy,
  },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
};

// ==========================================
// CUSTOMER TABS
// ==========================================
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={CustomerHomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Search" component={CustomerSearchScreen} options={{ title: 'Buscar' }} />
      <Tab.Screen name="Orders" component={CustomerOrdersScreen} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Profile" component={CustomerProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// ==========================================
// RESTAURANT TABS
// ==========================================
function RestaurantTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Menu') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'business' : 'business-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={RestaurantDashboardScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Orders" component={RestaurantOrdersScreen} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Menu" component={RestaurantMenuScreen} options={{ title: 'Menú' }} />
      <Tab.Screen name="Stats" component={RestaurantStatsScreen} options={{ title: 'Ventas' }} />
      <Tab.Screen name="Profile" component={RestaurantProfileScreen} options={{ title: 'Negocio' }} />
    </Tab.Navigator>
  );
}

// ==========================================
// DRIVER TABS
// ==========================================
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Deliveries') {
            iconName = focused ? 'bicycle' : 'bicycle-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={DriverHomeScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Deliveries" component={DriverDeliveriesScreen} options={{ title: 'Entregas' }} />
      <Tab.Screen name="Earnings" component={DriverEarningsScreen} options={{ title: 'Ganancias' }} />
      <Tab.Screen name="Profile" component={DriverProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// ==========================================
// ADMIN TABS
// ==========================================
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Restaurants') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={AdminDashboardScreen} options={{ title: 'Panel' }} />
      <Tab.Screen name="Users" component={AdminUsersScreen} options={{ title: 'Usuarios' }} />
      <Tab.Screen name="Restaurants" component={AdminRestaurantsScreen} options={{ title: 'Negocios' }} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Settings" component={AdminSettingsScreen} options={{ title: 'Config' }} />
    </Tab.Navigator>
  );
}

// ==========================================
// EDITOR TABS
// ==========================================
function EditorTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...tabScreenOptions,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'restaurant-outline';

          if (route.name === 'Restaurants') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'Chats') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Restaurants"
        component={EditorRestaurantsListScreen}
        options={{ title: 'Restaurantes' }}
      />
      <Tab.Screen
        name="Chats"
        component={EditorChatsScreen}
        options={{ title: 'Mensajes' }}
      />
      <Tab.Screen
        name="Profile"
        component={EditorProfileScreen}
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
}

// ==========================================
// MAIN NAVIGATOR
// ==========================================
export default function AppNavigator() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Tabs según rol
  const getTabsForRole = (role: UserRole) => {
    switch (role) {
      case 'customer':
      case 'client':
        return CustomerTabs;
      case 'restaurant':
      case 'merchant':
        return RestaurantTabs;
      case 'driver':
        return DriverTabs;
      case 'admin':
        return AdminTabs;
      case 'editor':
        return EditorTabs;
      default:
        return CustomerTabs;
    }
  };

  return (
    <NavigationContainer linking={linking} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          </Stack.Group>
        ) : !user?.emailVerified ? (
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        ) : (user?.role === 'driver' ||
            user?.role === 'restaurant' ||
            user?.role === 'merchant' ||
            user?.role === 'editor') &&
          user?.isApproved === false ? (
          // Gate de aprobación: roles operativos (driver/restaurant/editor)
          // que aún no fueron aprobados por admin ven solo PendingApproval
          // en lugar de las tabs de su rol. customer/admin pasan directo
          // porque se auto-aprueban en el registro.
          <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
        ) : (
          <Stack.Group>
            <Stack.Screen
              name="MainTabs"
              component={getTabsForRole(user?.role || 'customer')}
            />

            {/* Customer */}
            <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
            <Stack.Screen name="Cart" component={CartScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
            <Stack.Screen name="RateOrder" component={RateOrderScreen} />
            <Stack.Screen name="Chatbot" component={ChatbotScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="QuiuPoints" component={QuiuPointsScreen} />
            <Stack.Screen name="GroupOrder" component={GroupOrderScreen} />
            <Stack.Screen name="ScheduleOrder" component={ScheduleOrderScreen} />
            <Stack.Screen name="SurpriseMe" component={SurpriseMeScreen} />
            <Stack.Screen name="Stories" component={StoriesScreen} />
            <Stack.Screen name="LiveChat" component={LiveChatScreen} />

            {/* Restaurant */}
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="ProductEdit" component={ProductEditScreen} />
            <Stack.Screen name="RestaurantHours" component={RestaurantHoursScreen} />
            <Stack.Screen name="RestaurantAddress" component={RestaurantAddressScreen} />
            <Stack.Screen name="RestaurantPayments" component={RestaurantPaymentsScreen} />
            <Stack.Screen name="RestaurantNotifications" component={RestaurantNotificationsScreen} />
            <Stack.Screen name="RestaurantSupport" component={RestaurantSupportScreen} />

            {/* Driver */}
            <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
            <Stack.Screen name="AvailableOrders" component={AvailableOrdersScreen} />
            <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
            <Stack.Screen name="DriverProfileEdit" component={DriverProfileEditScreen} />
            <Stack.Screen name="EditProfile" component={CustomerProfileEditScreen} />
            <Stack.Screen name="Addresses" component={CustomerAddressesScreen} />
            <Stack.Screen name="AddressEdit" component={CustomerAddressEditScreen} />

            {/* Shared (chat por pedido entre customer/driver/restaurant) */}
            <Stack.Screen name="Chat" component={ChatScreen} />

            {/* Editor */}
            <Stack.Screen name="EditorProfileEdit" component={EditorProfileEditScreen} />

            {/* Admin */}
            <Stack.Screen name="AdminDrivers" component={AdminDriversScreen} />
            <Stack.Screen name="AdminDevoCoupons" component={AdminDevoCouponsScreen} />
            <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />
            <Stack.Screen name="AdminFinance" component={AdminFinanceScreen} />
            <Stack.Screen
              name="AdminEditors"
              component={AdminEditorsScreen}
              options={{ ...nativeStackHeaderOptions, headerShown: true, title: 'Editores' }}
            />

            {/* Editor */}
            <Stack.Screen
              name="EditorMenu"
              component={EditorMenuScreen}
              options={{ ...nativeStackHeaderOptions, headerShown: true }}
            />
            <Stack.Screen
              name="EditorProductEdit"
              component={EditorProductEditScreen}
              options={{ ...nativeStackHeaderOptions, headerShown: true }}
            />
            <Stack.Screen
              name="EditorRestaurantEdit"
              component={EditorRestaurantEditScreen}
              options={{ ...nativeStackHeaderOptions, headerShown: true }}
            />
            <Stack.Screen
              name="EditorChatDetail"
              component={EditorChatDetailScreen}
              options={{ ...nativeStackHeaderOptions, headerShown: true }}
            />

            {/* Legal */}
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
