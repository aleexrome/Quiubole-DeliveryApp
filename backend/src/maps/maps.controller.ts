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
import { Public } from '../auth/decorators/public.decorator';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('coverage')
  @Public()
  async getCoverageZones() {
    return this.mapsService.getCoverageZones();
  }

  @Get('check-coverage')
  @Public()
  async checkCoverage(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const inCoverage = await this.mapsService.isInCoverageArea(
      parseFloat(lat),
      parseFloat(lng),
    );
    return { inCoverage };
  }

  @Post('geocode')
  @UseGuards(JwtAuthGuard)
  async geocode(@Body('address') address: string) {
    const result = await this.mapsService.geocodeAddress(address);
    return result || { error: 'Address not found' };
  }

  @Post('reverse-geocode')
  @UseGuards(JwtAuthGuard)
  async reverseGeocode(
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
  ) {
    const address = await this.mapsService.reverseGeocode(latitude, longitude);
    return { address };
  }

  @Post('directions')
  @UseGuards(JwtAuthGuard)
  async getDirections(
    @Body() body: {
      originLat: number;
      originLng: number;
      destLat: number;
      destLng: number;
    },
  ) {
    return this.mapsService.getDirections(
      body.originLat,
      body.originLng,
      body.destLat,
      body.destLng,
    );
  }

  @Get('estimate-delivery')
  @Public()
  async estimateDelivery(
    @Query('restaurantLat') restaurantLat: string,
    @Query('restaurantLng') restaurantLng: string,
    @Query('deliveryLat') deliveryLat: string,
    @Query('deliveryLng') deliveryLng: string,
  ) {
    const distance = this.mapsService.calculateDistance(
      parseFloat(restaurantLat),
      parseFloat(restaurantLng),
      parseFloat(deliveryLat),
      parseFloat(deliveryLng),
    );
    const estimatedMinutes = this.mapsService.estimateDeliveryTime(distance);

    return {
      distanceKm: Math.round(distance * 10) / 10,
      estimatedMinutes,
    };
  }
}
