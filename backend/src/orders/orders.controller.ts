import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';
import { OrderStatus } from './order.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.create(createOrderDto, user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('my-orders')
  @Roles(UserRole.CLIENT)
  findMyOrders(@CurrentUser() user: any) {
    return this.ordersService.findByCustomer(user.id);
  }

  @Get('restaurant/:restaurantId')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.ordersService.findByRestaurant(restaurantId);
  }

  @Get('driver')
  @Roles(UserRole.DRIVER)
  findDriverOrders(@CurrentUser() user: any) {
    return this.ordersService.findByDriver(user.id);
  }

  @Get('pending')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  findPendingOrders() {
    return this.ordersService.findPendingOrders();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.DRIVER, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.RESTAURANT, UserRole.DRIVER, UserRole.ADMIN)
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  @Patch(':id/assign-driver')
  @Roles(UserRole.DRIVER, UserRole.ADMIN)
  assignDriver(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.assignDriver(id, user.id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }
}
