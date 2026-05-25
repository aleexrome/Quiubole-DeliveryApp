import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriverBalanceService } from './driver-balance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('drivers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DRIVER)
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
    private readonly driverBalanceService: DriverBalanceService,
  ) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.driversService.findOne(req.user.id);
  }

  @Put('status')
  async updateStatus(@Request() req, @Body('isAvailable') isAvailable: boolean) {
    return this.driversService.updateAvailability(req.user.id, isAvailable);
  }

  @Put('location')
  async updateLocation(
    @Request() req,
    @Body() body: { latitude: number; longitude: number },
  ) {
    return this.driversService.updateLocation(req.user.id, body.latitude, body.longitude);
  }

  @Get('orders')
  async getMyOrders(@Request() req) {
    return this.driversService.getDriverOrders(req.user.id);
  }

  @Get('orders/active')
  async getActiveOrders(@Request() req) {
    return this.driversService.getActiveOrders(req.user.id);
  }

  @Get('earnings')
  async getEarnings(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.driversService.getEarnings(req.user.id, start, end);
  }

  @Get('balance')
  async getBalance(@Request() req) {
    return this.driverBalanceService.getBalance(req.user.id);
  }

  @Get('stats')
  async getStats(@Request() req) {
    return this.driverBalanceService.getDriverStats(req.user.id);
  }

  /**
   * Actualiza info del vehículo del driver. Esta info se muestra al
   * cliente cuando se asigna driver al pedido (seguridad: el cliente
   * sabe qué placas/modelo buscar).
   */
  @Put('vehicle')
  async updateVehicle(
    @Request() req,
    @Body()
    body: {
      vehicleType?: string;
      vehiclePlate?: string;
      vehicleModel?: string;
      vehicleColor?: string;
    },
  ) {
    return this.driversService.updateVehicle(req.user.id, body);
  }
}
