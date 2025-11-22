// ==========================================
// MAPS SERVICE - Google Maps Integration
// ==========================================

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

// Interfaces
interface Coordinates {
  lat: number;
  lng: number;
}

interface DistanceResult {
  distance: number; // en metros
  distanceText: string;
  duration: number; // en segundos
  durationText: string;
}

interface GeocodingResult {
  formattedAddress: string;
  coordinates: Coordinates;
  placeId: string;
  components: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  types: string[];
}

interface DirectionsResult {
  distance: number;
  duration: number;
  polyline: string;
  steps: {
    instruction: string;
    distance: number;
    duration: number;
    startLocation: Coordinates;
    endLocation: Coordinates;
  }[];
}

@Injectable()
export class MapsService implements OnModuleInit {
  private readonly logger = new Logger(MapsService.name);
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  onModuleInit() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      this.logger.warn('Google Maps API key not configured - using simulated data');
    } else {
      this.logger.log('Google Maps service initialized');
    }
  }

  // ==========================================
  // DISTANCIA Y DURACIÓN
  // ==========================================

  async getDistance(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'driving' | 'walking' | 'bicycling' = 'driving',
  ): Promise<DistanceResult> {
    if (!this.apiKey) {
      return this.simulateDistance(origin, destination);
    }

    try {
      const url = `${this.baseUrl}/distancematrix/json`;
      const params = new URLSearchParams({
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode,
        key: this.apiKey,
        language: 'es',
        units: 'metric',
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK' || !data.rows[0]?.elements[0]) {
        throw new Error('Distance Matrix API error');
      }

      const element = data.rows[0].elements[0];

      return {
        distance: element.distance.value,
        distanceText: element.distance.text,
        duration: element.duration.value,
        durationText: element.duration.text,
      };
    } catch (error) {
      this.logger.error('Error getting distance:', error);
      return this.simulateDistance(origin, destination);
    }
  }

  async getDistanceMultiple(
    origin: Coordinates,
    destinations: Coordinates[],
  ): Promise<DistanceResult[]> {
    if (!this.apiKey) {
      return destinations.map((dest) => this.simulateDistance(origin, dest));
    }

    try {
      const url = `${this.baseUrl}/distancematrix/json`;
      const destinationsStr = destinations.map((d) => `${d.lat},${d.lng}`).join('|');

      const params = new URLSearchParams({
        origins: `${origin.lat},${origin.lng}`,
        destinations: destinationsStr,
        mode: 'driving',
        key: this.apiKey,
        language: 'es',
        units: 'metric',
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error('Distance Matrix API error');
      }

      return data.rows[0].elements.map((element: any) => ({
        distance: element.distance?.value || 0,
        distanceText: element.distance?.text || 'N/A',
        duration: element.duration?.value || 0,
        durationText: element.duration?.text || 'N/A',
      }));
    } catch (error) {
      this.logger.error('Error getting multiple distances:', error);
      return destinations.map((dest) => this.simulateDistance(origin, dest));
    }
  }

  // ==========================================
  // GEOCODIFICACIÓN
  // ==========================================

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      return this.simulateGeocode(address);
    }

    try {
      const url = `${this.baseUrl}/geocode/json`;
      const params = new URLSearchParams({
        address,
        key: this.apiKey,
        language: 'es',
        region: 'mx',
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results[0]) {
        return null;
      }

      const result = data.results[0];
      const components = this.parseAddressComponents(result.address_components);

      return {
        formattedAddress: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        placeId: result.place_id,
        components,
      };
    } catch (error) {
      this.logger.error('Error geocoding address:', error);
      return null;
    }
  }

  async reverseGeocode(coordinates: Coordinates): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      return this.simulateReverseGeocode(coordinates);
    }

    try {
      const url = `${this.baseUrl}/geocode/json`;
      const params = new URLSearchParams({
        latlng: `${coordinates.lat},${coordinates.lng}`,
        key: this.apiKey,
        language: 'es',
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK' || !data.results[0]) {
        return null;
      }

      const result = data.results[0];
      const components = this.parseAddressComponents(result.address_components);

      return {
        formattedAddress: result.formatted_address,
        coordinates,
        placeId: result.place_id,
        components,
      };
    } catch (error) {
      this.logger.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // ==========================================
  // PLACES AUTOCOMPLETE
  // ==========================================

  async searchPlaces(query: string, location?: Coordinates): Promise<PlaceResult[]> {
    if (!this.apiKey) {
      return this.simulatePlaceSearch(query);
    }

    try {
      const url = `${this.baseUrl}/place/autocomplete/json`;
      const params = new URLSearchParams({
        input: query,
        key: this.apiKey,
        language: 'es',
        components: 'country:mx',
        types: 'address',
      });

      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '50000'); // 50km
      }

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK') {
        return [];
      }

      return data.predictions.map((p: any) => ({
        placeId: p.place_id,
        name: p.structured_formatting?.main_text || p.description,
        address: p.description,
        coordinates: { lat: 0, lng: 0 }, // Requiere llamada adicional
        types: p.types || [],
      }));
    } catch (error) {
      this.logger.error('Error searching places:', error);
      return [];
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const url = `${this.baseUrl}/place/details/json`;
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        language: 'es',
        fields: 'name,formatted_address,geometry,types',
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK' || !data.result) {
        return null;
      }

      const result = data.result;
      return {
        placeId,
        name: result.name,
        address: result.formatted_address,
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        types: result.types || [],
      };
    } catch (error) {
      this.logger.error('Error getting place details:', error);
      return null;
    }
  }

  // ==========================================
  // DIRECCIONES (RUTAS)
  // ==========================================

  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
    waypoints?: Coordinates[],
  ): Promise<DirectionsResult | null> {
    if (!this.apiKey) {
      return this.simulateDirections(origin, destination);
    }

    try {
      const url = `${this.baseUrl}/directions/json`;
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: this.apiKey,
        language: 'es',
        mode: 'driving',
        units: 'metric',
      });

      if (waypoints && waypoints.length > 0) {
        const waypointsStr = waypoints.map((w) => `${w.lat},${w.lng}`).join('|');
        params.append('waypoints', waypointsStr);
      }

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status !== 'OK' || !data.routes[0]) {
        return null;
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.value,
          duration: step.duration.value,
          startLocation: {
            lat: step.start_location.lat,
            lng: step.start_location.lng,
          },
          endLocation: {
            lat: step.end_location.lat,
            lng: step.end_location.lng,
          },
        })),
      };
    } catch (error) {
      this.logger.error('Error getting directions:', error);
      return null;
    }
  }

  // ==========================================
  // CÁLCULO DE TARIFA DE ENVÍO
  // ==========================================

  calculateDeliveryFee(distanceMeters: number, baseRate: number = 20): number {
    const distanceKm = distanceMeters / 1000;

    // Tarifa base + costo por km
    // Primeros 3 km: tarifa base
    // Después: $5 por km adicional
    let fee = baseRate;

    if (distanceKm > 3) {
      fee += (distanceKm - 3) * 5;
    }

    // Mínimo $20, máximo $100
    return Math.min(Math.max(fee, 20), 100);
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private parseAddressComponents(components: any[]): GeocodingResult['components'] {
    const result: GeocodingResult['components'] = {};

    for (const component of components) {
      const types = component.types;

      if (types.includes('street_number')) {
        result.number = component.long_name;
      } else if (types.includes('route')) {
        result.street = component.long_name;
      } else if (types.includes('sublocality') || types.includes('neighborhood')) {
        result.neighborhood = component.long_name;
      } else if (types.includes('locality')) {
        result.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        result.state = component.long_name;
      } else if (types.includes('postal_code')) {
        result.postalCode = component.long_name;
      } else if (types.includes('country')) {
        result.country = component.long_name;
      }
    }

    return result;
  }

  // Fórmula Haversine para calcular distancia
  private calculateHaversineDistance(
    coord1: Coordinates,
    coord2: Coordinates,
  ): number {
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLon = this.toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(coord1.lat)) *
        Math.cos(this.toRad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // ==========================================
  // SIMULACIONES (cuando no hay API key)
  // ==========================================

  private simulateDistance(origin: Coordinates, destination: Coordinates): DistanceResult {
    const distance = this.calculateHaversineDistance(origin, destination);
    const duration = Math.round(distance / 500) * 60; // ~30km/h promedio

    return {
      distance: Math.round(distance),
      distanceText: `${(distance / 1000).toFixed(1)} km`,
      duration,
      durationText: `${Math.round(duration / 60)} min`,
    };
  }

  private simulateGeocode(address: string): GeocodingResult {
    return {
      formattedAddress: address,
      coordinates: {
        lat: 19.4326 + Math.random() * 0.1,
        lng: -99.1332 + Math.random() * 0.1,
      },
      placeId: 'simulated_place_id',
      components: {
        city: 'Ciudad de México',
        state: 'CDMX',
        country: 'México',
      },
    };
  }

  private simulateReverseGeocode(coordinates: Coordinates): GeocodingResult {
    return {
      formattedAddress: `Calle ${Math.round(coordinates.lat * 100)} #${Math.round(coordinates.lng * -100)}, CDMX`,
      coordinates,
      placeId: 'simulated_place_id',
      components: {
        street: `Calle ${Math.round(coordinates.lat * 100)}`,
        number: `${Math.round(coordinates.lng * -100)}`,
        neighborhood: 'Del Valle',
        city: 'Ciudad de México',
        state: 'CDMX',
        country: 'México',
      },
    };
  }

  private simulatePlaceSearch(query: string): PlaceResult[] {
    return [
      {
        placeId: 'place_1',
        name: query,
        address: `${query}, Ciudad de México, CDMX`,
        coordinates: { lat: 19.4326, lng: -99.1332 },
        types: ['address'],
      },
      {
        placeId: 'place_2',
        name: `${query} Centro`,
        address: `${query}, Centro Histórico, CDMX`,
        coordinates: { lat: 19.4328, lng: -99.1334 },
        types: ['address'],
      },
    ];
  }

  private simulateDirections(
    origin: Coordinates,
    destination: Coordinates,
  ): DirectionsResult {
    const distance = this.calculateHaversineDistance(origin, destination);
    const duration = Math.round(distance / 500) * 60;

    return {
      distance: Math.round(distance),
      duration,
      polyline: 'simulatedPolyline',
      steps: [
        {
          instruction: 'Dirígete hacia el norte',
          distance: Math.round(distance / 3),
          duration: Math.round(duration / 3),
          startLocation: origin,
          endLocation: {
            lat: (origin.lat + destination.lat) / 2,
            lng: origin.lng,
          },
        },
        {
          instruction: 'Gira a la derecha',
          distance: Math.round(distance / 3),
          duration: Math.round(duration / 3),
          startLocation: {
            lat: (origin.lat + destination.lat) / 2,
            lng: origin.lng,
          },
          endLocation: {
            lat: (origin.lat + destination.lat) / 2,
            lng: (origin.lng + destination.lng) / 2,
          },
        },
        {
          instruction: 'Continúa hasta el destino',
          distance: Math.round(distance / 3),
          duration: Math.round(duration / 3),
          startLocation: {
            lat: (origin.lat + destination.lat) / 2,
            lng: (origin.lng + destination.lng) / 2,
          },
          endLocation: destination,
        },
      ],
    };
  }
}
