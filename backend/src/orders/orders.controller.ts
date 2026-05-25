import {
  Controller,
  Get,
  Post,
  Put,
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
import { UserRole } from '../common/enums/user-role.enum';

class CreateOrderDto {
  restaurantId: string;
  items: { productId: string; quantity: number; options?: any }[];
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  // Indicaciones del domicilio (para el rider).
  deliveryInstructions?: string;
  // Notas sobre la comida (para el restaurante — "sin catsup", "sin chile").
  customerNotes?: string;
  paymentMethod: string;
  couponCode?: string;
  // ID de un UserCoupon (DevoCupon) que el cliente eligió aplicar.
  devoCouponId?: string;
  tip?: number;
}

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @Get()
  async getMyOrders(@Request() req, @Query('page') page: number = 1) {
    return this.ordersService.getUserOrders(req.user.id, page);
  }

  // ============================================
  // RUTAS ESTÁTICAS DE LISTA — DEBEN IR ANTES DE :id
  // ============================================

  /** Pedidos pendientes del restaurant del owner. */
  @Get('restaurant/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async getRestaurantPendingOrders(@Request() req) {
    return this.ordersService.getRestaurantOrders(req.user.id, 'pending');
  }

  /**
   * Listado completo de pedidos del restaurant del owner. Acepta filtro
   * `status` opcional (any OrderStatus). Sin status devuelve todos.
   */
  @Get('restaurant')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async getRestaurantOrders(
    @Request() req,
    @Query('status') status?: string,
  ) {
    return this.ordersService.getRestaurantOrders(req.user.id, status);
  }

  // ============================================
  // RUTAS CON :id
  // ============================================

  @Get(':id')
  async getOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.getOrderById(id, req.user.id);
  }

  // ============================================
  // ACCIONES DEL PEDIDO — Aceptan tanto PUT (legacy) como POST.
  // El frontend usa POST por convención; PUT se mantiene para retro-
  // compatibilidad con herramientas externas.
  // ============================================

  @Put(':id/cancel')
  @Post(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  @Put(':id/accept')
  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async acceptOrder(@Param('id') id: string) {
    return this.ordersService.acceptOrder(id);
  }

  /** Rechazar pedido por parte del restaurant. */
  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async rejectOrder(@Param('id') id: string, @Body() body: { reason?: string }) {
    return this.ordersService.rejectOrder(id, body?.reason);
  }

  /** Marca el pedido como "preparando" — paso intermedio entre
   *  accepted y ready. El restaurant indica que ya empezó a cocinar. */
  @Post(':id/preparing')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async markPreparing(@Param('id') id: string) {
    return this.ordersService.markPreparing(id);
  }

  @Put(':id/ready')
  @Post(':id/ready')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async markReady(@Param('id') id: string) {
    return this.ordersService.markReady(id);
  }

  // ============================================
  // DRIVER
  // ============================================
  @Get('driver/available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async getAvailableOrders(@Request() req) {
    return this.ordersService.getAvailableOrdersForDriver(req.user.id);
  }

  /** Driver toma el pedido (lo asigna a sí mismo). */
  @Post(':id/accept-delivery')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async acceptDelivery(@Param('id') id: string, @Request() req) {
    return this.ordersService.assignDriver(id, req.user.id);
  }

  @Put(':id/pickup')
  @Post(':id/pickup')
  @Post(':id/picked-up')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async pickupOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.pickupOrder(id, req.user.id);
  }

  @Put(':id/deliver')
  @Post(':id/deliver')
  @Post(':id/delivered')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async deliverOrder(@Param('id') id: string) {
    return this.ordersService.deliverOrder(id);
  }
}
