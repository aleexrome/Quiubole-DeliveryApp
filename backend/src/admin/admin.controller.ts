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
import { UserRole } from '../common/enums/user-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async getUsers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, role, search);
  }

  @Get('users-stats')
  async getUsersStats() {
    return this.adminService.getUserStats();
  }

  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateUser(id, data);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ============ APROBACIÓN DE USUARIOS ============
  // Aplica a roles driver/restaurant/editor que requieren revisión.
  // customer/admin se auto-aprueban en el registro.

  @Post('users/:id/approve')
  async approveUser(@Param('id') id: string) {
    return this.adminService.approveUser(id);
  }

  @Post('users/:id/reject')
  async rejectUser(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.rejectUser(id, body?.reason);
  }

  // ============ APROBACIÓN DE PRODUCTOS ============

  @Post('products/:id/approve')
  async approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Post('products/:id/reject')
  async rejectProduct(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.adminService.rejectProduct(id, body?.reason);
  }

  @Get('products')
  async getProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Query('status') status?: 'pending' | 'approved' | 'all',
  ) {
    return this.adminService.getProducts(page, limit, status);
  }

  @Get('products-stats')
  async getProductsStats() {
    return this.adminService.getProductsStats();
  }

  @Get('restaurants')
  async getRestaurants(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Query('status') status?: 'pending' | 'approved' | 'all',
  ) {
    return this.adminService.getRestaurants(page, limit, status);
  }

  @Put('restaurants/:id/approve')
  async approveRestaurant(@Param('id') id: string) {
    return this.adminService.approveRestaurant(id);
  }

  // Alias POST para el front que históricamente llama POST en vez de PUT.
  @Post('restaurants/:id/approve')
  async approveRestaurantPost(@Param('id') id: string) {
    return this.adminService.approveRestaurant(id);
  }

  @Get('orders')
  async getOrders(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Query('status') status?: string,
  ) {
    return this.adminService.getOrders(page, limit, status);
  }

  @Get('orders-stats')
  async getOrdersStats() {
    return this.adminService.getOrdersStats();
  }

  @Get('restaurants-stats')
  async getRestaurantsStats() {
    return this.adminService.getRestaurantsStats();
  }

  @Get('drivers')
  async getDrivers(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 100,
    @Query('status') status?: 'all' | 'active' | 'inactive' | 'pending',
  ) {
    return this.adminService.getDrivers(page, limit, status);
  }

  @Get('drivers-stats')
  async getDriversStats() {
    return this.adminService.getDriversStats();
  }
}
