// ==========================================
// DRIVERS CONTROLLER - Gestion de Repartidores
// ==========================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('driver')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('driver')
export class DriversController {
  constructor(private driversService: DriversService) {}

  // Actualizar estado (online/offline)
  @Patch('status')
  async updateStatus(
    @Request() req,
    @Body('status') status: 'online' | 'offline' | 'busy',
  ) {
    return this.driversService.updateStatus(req.user.id, status);
  }

  // Actualizar ubicacion en tiempo real
  @Patch('location')
  async updateLocation(
    @Request() req,
    @Body('lat') lat: number,
    @Body('lng') lng: number,
  ) {
    return this.driversService.updateLocation(req.user.id, lat, lng);
  }

  // Obtener ganancias
  @Get('earnings')
  async getEarnings(
    @Request() req,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.driversService.getEarnings(req.user.id, period);
  }

  // Obtener historial de entregas
  @Get('history')
  async getDeliveryHistory(
    @Request() req,
    @Query('page') page: number = 1,
  ) {
    return this.driversService.getDeliveryHistory(req.user.id, page);
  }

  // Obtener estadisticas
  @Get('stats')
  async getStats(@Request() req) {
    return this.driversService.getStats(req.user.id);
  }
}
