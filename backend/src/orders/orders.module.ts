import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { User } from '../users/user.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { DevoCouponsModule } from '../devo-coupons/devo-coupons.module';

@Module({
  imports: [
    // User entity necesario para broadcast a drivers activos.
    TypeOrmModule.forFeature([Order, OrderItem, Product, Restaurant, User]),
    NotificationsModule,
    // DevoCouponsModule expone DevoCouponsService que se inyecta en
    // OrdersService.deliverOrder() para sumar puntos al cliente.
    DevoCouponsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}
