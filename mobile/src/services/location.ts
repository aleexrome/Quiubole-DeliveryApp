// ==========================================
// LOCATION SERVICE - Mobile (Expo)
// ==========================================

import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import api from './api';

// Tipos
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LocationResult {
  coordinates: Coordinates;
  accuracy: number;
  timestamp: number;
}

export interface AddressResult {
  formattedAddress: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface DistanceResult {
  distance: number;
  distanceText: string;
  duration: number;
  durationText: string;
}

export interface DeliveryFeeResult extends DistanceResult {
  deliveryFee: number;
}

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationResult | null = null;

  // ==========================================
  // PERMISOS
  // ==========================================

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Necesitamos acceso a tu ubicación para mostrarte restaurantes cercanos y rastrear entregas.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async requestBackgroundPermissions(): Promise<boolean> {
    try {
      // Primero necesitamos permiso de foreground
      const foregroundGranted = await this.requestPermissions();
      if (!foregroundGranted) return false;

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        Alert.alert(
          'Permiso de ubicación en segundo plano',
          'Para rastrear entregas en tiempo real, necesitamos acceso a tu ubicación en segundo plano.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Configuración', onPress: () => Linking.openSettings() },
          ],
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error requesting background permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<{
    foreground: boolean;
    background: boolean;
  }> {
    const foreground = await Location.getForegroundPermissionsAsync();
    const background = await Location.getBackgroundPermissionsAsync();

    return {
      foreground: foreground.status === 'granted',
      background: background.status === 'granted',
    };
  }

  // ==========================================
  // UBICACIÓN ACTUAL
  // ==========================================

  async getCurrentLocation(highAccuracy: boolean = false): Promise<LocationResult | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: highAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const result: LocationResult = {
        coordinates: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };

      this.lastKnownLocation = result;
      return result;
    } catch (error) {
      console.error('Error getting current location:', error);
      return this.lastKnownLocation;
    }
  }

  async getLastKnownLocation(): Promise<LocationResult | null> {
    try {
      const location = await Location.getLastKnownPositionAsync();
      if (!location) return this.lastKnownLocation;

      return {
        coordinates: {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        },
        accuracy: location.coords.accuracy || 0,
        timestamp: location.timestamp,
      };
    } catch (error) {
      return this.lastKnownLocation;
    }
  }

  // ==========================================
  // SEGUIMIENTO EN TIEMPO REAL
  // ==========================================

  async startWatching(
    callback: (location: LocationResult) => void,
    options?: {
      accuracy?: Location.Accuracy;
      distanceInterval?: number; // metros
      timeInterval?: number; // milisegundos
    },
  ): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Detener cualquier seguimiento anterior
      this.stopWatching();

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval || 10, // cada 10m
          timeInterval: options?.timeInterval || 5000, // cada 5s
        },
        (location) => {
          const result: LocationResult = {
            coordinates: {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            },
            accuracy: location.coords.accuracy || 0,
            timestamp: location.timestamp,
          };

          this.lastKnownLocation = result;
          callback(result);
        },
      );

      return true;
    } catch (error) {
      console.error('Error starting location watch:', error);
      return false;
    }
  }

  stopWatching(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
  }

  // ==========================================
  // GEOCODIFICACIÓN
  // ==========================================

  async reverseGeocode(coordinates: Coordinates): Promise<AddressResult | null> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });

      if (!results || results.length === 0) return null;

      const result = results[0];

      return {
        formattedAddress: this.formatAddress(result),
        street: result.street || undefined,
        number: result.streetNumber || undefined,
        neighborhood: result.district || result.subregion || undefined,
        city: result.city || undefined,
        state: result.region || undefined,
        postalCode: result.postalCode || undefined,
        country: result.country || undefined,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  async geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
      const results = await Location.geocodeAsync(address);

      if (!results || results.length === 0) return null;

      return {
        lat: results[0].latitude,
        lng: results[0].longitude,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  // ==========================================
  // API CALLS (Backend)
  // ==========================================

  async getDistance(
    origin: Coordinates,
    destination: Coordinates,
  ): Promise<DistanceResult | null> {
    try {
      const response = await api.post('/maps/distance', {
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
      });
      return response.data;
    } catch (error) {
      console.error('Error getting distance:', error);
      return this.calculateLocalDistance(origin, destination);
    }
  }

  async calculateDeliveryFee(
    restaurantLocation: Coordinates,
    deliveryLocation: Coordinates,
  ): Promise<DeliveryFeeResult | null> {
    try {
      const response = await api.post('/maps/delivery-fee', {
        restaurantLat: restaurantLocation.lat,
        restaurantLng: restaurantLocation.lng,
        deliveryLat: deliveryLocation.lat,
        deliveryLng: deliveryLocation.lng,
      });
      return response.data;
    } catch (error) {
      console.error('Error calculating delivery fee:', error);

      // Cálculo local de respaldo
      const distance = this.calculateLocalDistance(restaurantLocation, deliveryLocation);
      if (!distance) return null;

      const distanceKm = distance.distance / 1000;
      let fee = 20; // Base
      if (distanceKm > 3) {
        fee += (distanceKm - 3) * 5;
      }
      fee = Math.min(Math.max(fee, 20), 100);

      return {
        ...distance,
        deliveryFee: Math.round(fee),
      };
    }
  }

  async searchPlaces(
    query: string,
    nearLocation?: Coordinates,
  ): Promise<Array<{ placeId: string; name: string; address: string }>> {
    try {
      const params = new URLSearchParams({ query });
      if (nearLocation) {
        params.append('lat', nearLocation.lat.toString());
        params.append('lng', nearLocation.lng.toString());
      }

      const response = await api.get(`/maps/places/search?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  private formatAddress(geocodeResult: Location.LocationGeocodedAddress): string {
    const parts: string[] = [];

    if (geocodeResult.street) {
      let streetPart = geocodeResult.street;
      if (geocodeResult.streetNumber) {
        streetPart += ` ${geocodeResult.streetNumber}`;
      }
      parts.push(streetPart);
    }

    if (geocodeResult.district) {
      parts.push(geocodeResult.district);
    }

    if (geocodeResult.city) {
      parts.push(geocodeResult.city);
    }

    if (geocodeResult.region) {
      parts.push(geocodeResult.region);
    }

    return parts.join(', ');
  }

  private calculateLocalDistance(
    origin: Coordinates,
    destination: Coordinates,
  ): DistanceResult {
    // Fórmula Haversine
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLon = this.toRad(destination.lng - origin.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(origin.lat)) *
        Math.cos(this.toRad(destination.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimación de duración (30 km/h promedio en ciudad)
    const durationSeconds = (distance / 1000 / 30) * 3600;

    return {
      distance: Math.round(distance),
      distanceText: `${(distance / 1000).toFixed(1)} km`,
      duration: Math.round(durationSeconds),
      durationText: `${Math.round(durationSeconds / 60)} min`,
    };
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)} seg`;
    }
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }
}

export const locationService = new LocationService();
export default locationService;
