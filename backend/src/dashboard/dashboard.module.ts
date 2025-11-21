import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Review } from '../reviews/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Restaurant, Review])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
