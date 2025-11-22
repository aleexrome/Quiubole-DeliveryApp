// ==========================================
// NAVEGACION PRINCIPAL CON ROLES
// ==========================================

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import { linking } from '../config/linking';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';

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

// Driver Screens
import DriverHomeScreen from '../screens/driver/HomeScreen';
import DriverDeliveriesScreen from '../screens/driver/DeliveriesScreen';
import DriverEarningsScreen from '../screens/driver/EarningsScreen';
import DriverProfileScreen from '../screens/driver/ProfileScreen';
import ActiveDeliveryScreen from '../screens/driver/ActiveDeliveryScreen';
import AvailableOrdersScreen from '../screens/driver/AvailableOrdersScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import AdminUsersScreen from '../screens/admin/UsersScreen';
import AdminRestaurantsScreen from '../screens/admin/RestaurantsScreen';
import AdminOrdersScreen from '../screens/admin/OrdersScreen';
import AdminDriversScreen from '../screens/admin/DriversScreen';
import AdminProductsScreen from '../screens/admin/ProductsScreen';
import AdminSettingsScreen from '../screens/admin/SettingsScreen';

// Legal Screens
import TermsScreen from '../screens/legal/TermsScreen';
import PrivacyScreen from '../screens/legal/PrivacyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// CUSTOMER TABS
// ==========================================
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
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
            iconName = focused ? 'storefront' : 'storefront-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard" component={RestaurantDashboardScreen} options={{ title: 'Inicio' }} />
      <Tab.Screen name="Orders" component={RestaurantOrdersScreen} options={{ title: 'Pedidos' }} />
      <Tab.Screen name="Menu" component={RestaurantMenuScreen} options={{ title: 'Menu' }} />
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
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
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
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
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
// MAIN NAVIGATOR
// ==========================================
export default function AppNavigator() {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Función para obtener las tabs según el rol
  const getTabsForRole = (role: UserRole) => {
    switch (role) {
      case 'customer':
        return CustomerTabs;
      case 'restaurant':
        return RestaurantTabs;
      case 'driver':
        return DriverTabs;
      case 'admin':
        return AdminTabs;
      default:
        return CustomerTabs;
    }
  };

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
          // Email verification required
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        ) : (
          // Main App Stack based on role
          <Stack.Group>
            <Stack.Screen
              name="MainTabs"
              component={getTabsForRole(user?.role || 'customer')}
            />

            {/* Customer specific screens */}
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

            {/* Restaurant specific screens */}
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="ProductEdit" component={ProductEditScreen} />

            {/* Driver specific screens */}
            <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
            <Stack.Screen name="AvailableOrders" component={AvailableOrdersScreen} />

            {/* Admin specific screens */}
            <Stack.Screen name="AdminDrivers" component={AdminDriversScreen} />
            <Stack.Screen name="AdminProducts" component={AdminProductsScreen} />

            {/* Legal screens */}
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
