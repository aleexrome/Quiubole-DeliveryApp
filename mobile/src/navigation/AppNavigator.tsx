import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '../utils/theme';
import { useAuthStore, useCartStore } from '../context/store';

// Auth Screens
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/home/HomeScreen';
import RestaurantDetailsScreen from '../screens/home/RestaurantDetailsScreen';
import ProductDetailsScreen from '../screens/home/ProductDetailsScreen';
import CartScreen from '../screens/cart/CartScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';

import SearchScreen from '../screens/search/SearchScreen';

import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailsScreen from '../screens/orders/OrderDetailsScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';

import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AddressesScreen from '../screens/profile/AddressesScreen';
import FavoritesScreen from '../screens/profile/FavoritesScreen';

import type {
  RootStackParamList,
  AuthStackParamList,
  MainTabParamList,
  HomeStackParamList,
  OrdersStackParamList,
  ProfileStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const OrdersStack = createNativeStackNavigator<OrdersStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

// Animated Tab Bar Icon
const AnimatedTabIcon = ({
  name,
  focused,
  color,
  badge,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  color: string;
  badge?: number;
}) => {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.15 : 1, {
      damping: 10,
      stiffness: 150,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
      <Ionicons name={name} size={24} color={color} />
      {badge && badge > 0 && (
        <View style={styles.badge}>
          <Animated.Text style={styles.badgeText}>
            {badge > 99 ? '99+' : badge}
          </Animated.Text>
        </View>
      )}
    </Animated.View>
  );
};

// Auth Navigator
const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Home Stack Navigator
const HomeNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen
      name="RestaurantDetails"
      component={RestaurantDetailsScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
    <HomeStack.Screen
      name="ProductDetails"
      component={ProductDetailsScreen}
      options={{ animation: 'slide_from_bottom' }}
    />
    <HomeStack.Screen
      name="Cart"
      component={CartScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <HomeStack.Screen
      name="Checkout"
      component={CheckoutScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <HomeStack.Screen
      name="OrderTracking"
      component={OrderTrackingScreen}
      options={{ animation: 'fade' }}
    />
  </HomeStack.Navigator>
);

// Orders Stack Navigator
const OrdersNavigator = () => (
  <OrdersStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <OrdersStack.Screen name="Orders" component={OrdersScreen} />
    <OrdersStack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    <OrdersStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
  </OrdersStack.Navigator>
);

// Profile Stack Navigator
const ProfileNavigator = () => (
  <ProfileStack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
    }}
  >
    <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="Addresses" component={AddressesScreen} />
    <ProfileStack.Screen name="Favorites" component={FavoritesScreen} />
  </ProfileStack.Navigator>
);

// Main Tab Navigator
const MainNavigator = () => {
  const cartItemCount = useCartStore((state) => state.getItemCount());

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={focused ? 'home' : 'home-outline'}
              focused={focused}
              color={color}
              badge={cartItemCount}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={focused ? 'search' : 'search-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersNavigator}
        options={{
          tabBarLabel: 'Pedidos',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={focused ? 'receipt' : 'receipt-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ focused, color }) => (
            <AnimatedTabIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const AppNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    height: 85,
    paddingTop: 8,
    paddingBottom: 25,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default AppNavigator;
