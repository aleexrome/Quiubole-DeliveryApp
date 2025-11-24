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
  deliveryInstructions?: string;
  paymentMethod: string;
  couponCode?: string;
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

  @Get(':id')
  async getOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.getOrderById(id, req.user.id);
  }

  @Put(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.cancelOrder(id, req.user.id);
  }

  // Restaurant endpoints
  @Get('restaurant/pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async getRestaurantPendingOrders(@Request() req) {
    return this.ordersService.getRestaurantOrders(req.user.id, 'pending');
  }

  @Put(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async acceptOrder(@Param('id') id: string) {
    return this.ordersService.acceptOrder(id);
  }

  @Put(':id/ready')
  @UseGuards(RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async markReady(@Param('id') id: string) {
    return this.ordersService.markReady(id);
  }

  // Driver endpoints
  @Get('driver/available')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async getAvailableOrders(@Request() req) {
    return this.ordersService.getAvailableOrdersForDriver(req.user.id);
  }

  @Put(':id/pickup')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async pickupOrder(@Param('id') id: string, @Request() req) {
    return this.ordersService.pickupOrder(id, req.user.id);
  }

  @Put(':id/deliver')
  @UseGuards(RolesGuard)
  @Roles(UserRole.DRIVER)
  async deliverOrder(@Param('id') id: string) {
    return this.ordersService.deliverOrder(id);
  }
}
