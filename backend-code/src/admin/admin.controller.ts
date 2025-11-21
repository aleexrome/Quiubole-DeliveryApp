// ==========================================
// ADMIN CONTROLLER - Panel de Administracion
// ==========================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==========================================
  // DASHBOARD
  // ==========================================

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ==========================================
  // USUARIOS
  // ==========================================

  @Get('users')
  async getUsers(
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('page') page: number = 1,
  ) {
    return this.adminService.getUsers({ role, search, page });
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @Post('users/:id/ban')
  async banUser(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.banUser(id, reason);
  }

  // ==========================================
  // RESTAURANTES
  // ==========================================

  @Get('restaurants/pending')
  async getPendingRestaurants() {
    return this.adminService.getPendingRestaurants();
  }

  @Post('restaurants/:id/approve')
  async approveRestaurant(@Param('id') id: string) {
    return this.adminService.approveRestaurant(id);
  }

  @Post('restaurants/:id/reject')
  async rejectRestaurant(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.adminService.rejectRestaurant(id, reason);
  }

  // ==========================================
  // REPARTIDORES
  // ==========================================

  @Get('drivers/pending')
  async getPendingDrivers() {
    return this.adminService.getPendingDrivers();
  }

  @Post('drivers/:id/approve')
  async approveDriver(@Param('id') id: string) {
    return this.adminService.approveDriver(id);
  }

  @Post('drivers/:id/reject')
  async rejectDriver(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectDriver(id, reason);
  }

  // ==========================================
  // PRODUCTOS (Control de calidad)
  // ==========================================

  @Get('products/pending')
  async getPendingProducts() {
    return this.adminService.getPendingProducts();
  }

  @Post('products/:id/approve')
  async approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Post('products/:id/reject')
  async rejectProduct(@Param('id') id: string, @Body('reason') reason: string) {
    return this.adminService.rejectProduct(id, reason);
  }

  // Admin puede editar cualquier producto (precios, descripciones, imagenes)
  @Put('products/:id')
  async updateProduct(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateProduct(id, data);
  }

  // ==========================================
  // CUPONES
  // ==========================================

  @Get('coupons')
  async getCoupons() {
    return this.adminService.getCoupons();
  }

  @Post('coupons')
  async createCoupon(@Body() data: any) {
    return this.adminService.createCoupon(data);
  }

  @Put('coupons/:id')
  async updateCoupon(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateCoupon(id, data);
  }

  @Delete('coupons/:id')
  async deleteCoupon(@Param('id') id: string) {
    return this.adminService.deleteCoupon(id);
  }
}
