import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { FinanceService } from './finance.service';
import { UsersModule } from '../users/users.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [
    UsersModule,
    RestaurantsModule,
    ProductsModule,
    OrdersModule,
    CouponsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, FinanceService],
  exports: [AdminService, FinanceService],
})
export class AdminModule {}
