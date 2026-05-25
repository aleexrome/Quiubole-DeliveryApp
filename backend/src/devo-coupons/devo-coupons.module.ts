import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCoupon } from './user-coupon.entity';
import { User } from '../users/user.entity';
import { DevoCouponsService } from './devo-coupons.service';
import { DevoCouponsController } from './devo-coupons.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCoupon, User]),
    NotificationsModule,
  ],
  controllers: [DevoCouponsController],
  providers: [DevoCouponsService],
  exports: [DevoCouponsService],
})
export class DevoCouponsModule {}
