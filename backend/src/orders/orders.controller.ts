// ==========================================
// ORDERS CONTROLLER - Gestion de Pedidos
// ==========================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// DTOs
class CreateOrderDto {
  restaurantId: string;
  items: { productId: string; quantity: number; options?: any[] }[];
  deliveryAddressId: string;
  paymentMethod: 'card' | 'cash';
  specialInstructions?: string;
  tip?: number;
  couponCode?: string;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // ==========================================
  // ENDPOINTS PARA CLIENTES
  // ==========================================

  // Crear pedido
  @Post()
  @Roles('customer')
  @UseGuards(RolesGuard)
  async createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, dto);
  }

  // Obtener mis pedidos (cliente)
  @Get('my')
  @Roles('customer')
  @UseGuards(RolesGuard)
  async getMyOrders(@Request() req) {
    return this.ordersService.getCustomerOrders(req.user.id);
  }

  // Obtener detalle de pedido
  @Get(':id')
  async getOrderById(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, req.user);
  }

  // Cancelar pedido (cliente)
  @Post(':id/cancel')
  @Roles('customer')
  @UseGuards(RolesGuard)
  async cancelOrder(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.cancelOrder(id, req.user.id, reason);
  }

  // ==========================================
  // ENDPOINTS PARA RESTAURANTES
  // ==========================================

  // Obtener pedidos del restaurante
  @Get('restaurant')
  @Roles('restaurant')
  @UseGuards(RolesGuard)
  async getRestaurantOrders(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getRestaurantOrders(req.user.restaurantId, status);
  }

  // Aceptar pedido
  @Post(':id/accept')
  @Roles('restaurant')
  @UseGuards(RolesGuard)
  async acceptOrder(
    @Param('id') id: string,
    @Body('estimatedTime') estimatedTime: number,
  ) {
    return this.ordersService.acceptOrder(id, estimatedTime);
  }

  // Rechazar pedido
  @Post(':id/reject')
  @Roles('restaurant')
  @UseGuards(RolesGuard)
  async rejectOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.rejectOrder(id, reason);
  }

  // Marcar como preparando
  @Post(':id/preparing')
  @Roles('restaurant')
  @UseGuards(RolesGuard)
  async markPreparing(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, 'preparing');
  }

  // Marcar como listo para recoger
  @Post(':id/ready')
  @Roles('restaurant')
  @UseGuards(RolesGuard)
  async markReady(@Param('id') id: string) {
    // Esto dispara la busqueda de repartidores
    return this.ordersService.markReadyForPickup(id);
  }

  // ==========================================
  // ENDPOINTS PARA REPARTIDORES
  // ==========================================

  // Obtener pedidos disponibles cerca
  @Get('available')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async getAvailableOrders(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 5,
  ) {
    return this.ordersService.getAvailableOrdersForDriver(lat, lng, radius);
  }

  // Aceptar entrega
  @Post(':id/accept-delivery')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async acceptDelivery(@Request() req, @Param('id') id: string) {
    return this.ordersService.assignDriver(id, req.user.id);
  }

  // Marcar como recogido
  @Post(':id/picked-up')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async markPickedUp(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, 'picked_up');
  }

  // Marcar como entregado
  @Post(':id/delivered')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async markDelivered(@Param('id') id: string) {
    return this.ordersService.markDelivered(id);
  }

  // Obtener entregas del repartidor
  @Get('driver')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async getDriverOrders(@Request() req) {
    return this.ordersService.getDriverOrders(req.user.id);
  }

  // Obtener entrega activa
  @Get('driver/active')
  @Roles('driver')
  @UseGuards(RolesGuard)
  async getActiveDelivery(@Request() req) {
    return this.ordersService.getActiveDelivery(req.user.id);
  }

  // ==========================================
  // ENDPOINTS PARA ADMIN
  // ==========================================

  // Obtener todos los pedidos
  @Get('admin')
  @Roles('admin')
  @UseGuards(RolesGuard)
  async getAllOrders(
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.ordersService.getAllOrders({ status, from, to, page, limit });
  }
}
