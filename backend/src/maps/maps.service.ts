import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoverageZone } from '../coverage-zones/coverage-zone.entity';

@Injectable()
export class MapsService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(CoverageZone)
    private coverageZonesRepository: Repository<CoverageZone>,
  ) {}

  // Calculate distance between two points using Haversine formula
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Estimate delivery time based on distance
  estimateDeliveryTime(distanceKm: number): number {
    // Assume average speed of 25 km/h in urban areas
    const avgSpeedKmh = 25;
    const baseMinutes = 10; // Restaurant prep time buffer
    const travelMinutes = (distanceKm / avgSpeedKmh) * 60;
    return Math.ceil(baseMinutes + travelMinutes);
  }

  // Check if a location is within delivery coverage
  async isInCoverageArea(latitude: number, longitude: number): Promise<boolean> {
    const zones = await this.coverageZonesRepository.find({
      where: { isActive: true },
    });

    for (const zone of zones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        Number(zone.centerLatitude),
        Number(zone.centerLongitude),
      );
      if (distance <= Number(zone.radiusKm)) {
        return true;
      }
    }

    return false;
  }

  // Get coverage zones
  async getCoverageZones() {
    return this.coverageZonesRepository.find({
      where: { isActive: true },
    });
  }

  // Geocode address (placeholder - integrate with Google Maps API)
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    const googleApiKey = this.configService.get('GOOGLE_MAPS_API_KEY');

    if (!googleApiKey) {
      // Return mock data for development
      console.log('Google Maps API key not configured, returning mock coordinates');
      return { lat: 20.6597, lng: -103.3496 }; // Guadalajara, Mexico
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`,
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return { lat: location.lat, lng: location.lng };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to address
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    const googleApiKey = this.configService.get('GOOGLE_MAPS_API_KEY');

    if (!googleApiKey) {
      return `${latitude}, ${longitude}`;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`,
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  // Get directions between two points (placeholder)
  async getDirections(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
  ) {
    const distance = this.calculateDistance(originLat, originLng, destLat, destLng);
    const estimatedTime = this.estimateDeliveryTime(distance);

    return {
      distance: Math.round(distance * 10) / 10,
      distanceUnit: 'km',
      estimatedTime,
      timeUnit: 'minutes',
    };
  }

  // Find nearest available drivers
  async findNearbyDrivers(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
  ) {
    // This would integrate with real-time driver locations
    // Placeholder implementation
    return [];
  }
}
