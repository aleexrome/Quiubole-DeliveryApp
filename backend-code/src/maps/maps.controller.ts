// ==========================================
// MAPS CONTROLLER
// ==========================================

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MapsService } from './maps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// DTOs
class DistanceDto {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  mode?: 'driving' | 'walking' | 'bicycling';
}

class GeocodeDto {
  address: string;
}

class ReverseGeocodeDto {
  lat: number;
  lng: number;
}

class DirectionsDto {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  waypoints?: { lat: number; lng: number }[];
}

class DeliveryFeeDto {
  restaurantLat: number;
  restaurantLng: number;
  deliveryLat: number;
  deliveryLng: number;
}

@Controller('maps')
export class MapsController {
  constructor(private mapsService: MapsService) {}

  // ==========================================
  // DISTANCIA Y DURACIÓN
  // ==========================================

  @Post('distance')
  @UseGuards(JwtAuthGuard)
  async getDistance(@Body() body: DistanceDto) {
    return this.mapsService.getDistance(
      { lat: body.originLat, lng: body.originLng },
      { lat: body.destinationLat, lng: body.destinationLng },
      body.mode,
    );
  }

  // ==========================================
  // GEOCODIFICACIÓN
  // ==========================================

  @Post('geocode')
  @UseGuards(JwtAuthGuard)
  async geocode(@Body() body: GeocodeDto) {
    return this.mapsService.geocodeAddress(body.address);
  }

  @Post('reverse-geocode')
  @UseGuards(JwtAuthGuard)
  async reverseGeocode(@Body() body: ReverseGeocodeDto) {
    return this.mapsService.reverseGeocode({ lat: body.lat, lng: body.lng });
  }

  // ==========================================
  // BÚSQUEDA DE LUGARES
  // ==========================================

  @Get('places/search')
  @UseGuards(JwtAuthGuard)
  async searchPlaces(
    @Query('query') query: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
  ) {
    const location = lat && lng ? { lat, lng } : undefined;
    return this.mapsService.searchPlaces(query, location);
  }

  @Get('places/:placeId')
  @UseGuards(JwtAuthGuard)
  async getPlaceDetails(@Query('placeId') placeId: string) {
    return this.mapsService.getPlaceDetails(placeId);
  }

  // ==========================================
  // DIRECCIONES
  // ==========================================

  @Post('directions')
  @UseGuards(JwtAuthGuard)
  async getDirections(@Body() body: DirectionsDto) {
    return this.mapsService.getDirections(
      { lat: body.originLat, lng: body.originLng },
      { lat: body.destinationLat, lng: body.destinationLng },
      body.waypoints,
    );
  }

  // ==========================================
  // TARIFA DE ENVÍO
  // ==========================================

  @Post('delivery-fee')
  async calculateDeliveryFee(@Body() body: DeliveryFeeDto) {
    const distance = await this.mapsService.getDistance(
      { lat: body.restaurantLat, lng: body.restaurantLng },
      { lat: body.deliveryLat, lng: body.deliveryLng },
    );

    const fee = this.mapsService.calculateDeliveryFee(distance.distance);

    return {
      distance: distance.distance,
      distanceText: distance.distanceText,
      duration: distance.duration,
      durationText: distance.durationText,
      deliveryFee: fee,
    };
  }
}
