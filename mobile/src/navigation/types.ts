import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { Product, Restaurant } from '../context/store';

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

// Home Stack
export type HomeStackParamList = {
  Home: undefined;
  RestaurantDetails: { restaurant: Restaurant };
  ProductDetails: { product: Product; restaurant: Restaurant };
  Cart: undefined;
  Checkout: undefined;
  OrderTracking: { orderId: string };
};

// Search Stack
export type SearchStackParamList = {
  Search: undefined;
  SearchResults: { query: string; category?: string };
  RestaurantDetails: { restaurant: Restaurant };
  ProductDetails: { product: Product; restaurant: Restaurant };
};

// Orders Stack
export type OrdersStackParamList = {
  Orders: undefined;
  OrderDetails: { orderId: string };
  OrderTracking: { orderId: string };
  Review: { orderId: string; restaurantId: string };
};

// Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Addresses: undefined;
  AddAddress: undefined;
  EditAddress: { addressId: string };
  PaymentMethods: undefined;
  Favorites: undefined;
  Settings: undefined;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen Props Types
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type SearchStackScreenProps<T extends keyof SearchStackParamList> =
  NativeStackScreenProps<SearchStackParamList, T>;

export type OrdersStackScreenProps<T extends keyof OrdersStackParamList> =
  NativeStackScreenProps<OrdersStackParamList, T>;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;
