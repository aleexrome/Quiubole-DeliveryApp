import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { DriverBalanceService } from './driver-balance.service';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order]), NotificationsModule],
  controllers: [DriversController],
  providers: [DriversService, DriverBalanceService],
  exports: [DriversService, DriverBalanceService],
})
export class DriversModule {}
