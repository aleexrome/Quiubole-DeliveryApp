import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './restaurant.entity';
import { Order } from '../orders/order.entity';
import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { EditorsModule } from '../editors/editors.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    // Order necesario para `getStats` que cuenta orders y suma revenue
    // del restaurant del owner autenticado.
    TypeOrmModule.forFeature([Restaurant, Order]),
    forwardRef(() => EditorsModule),
    NotificationsModule,
  ],
  providers: [RestaurantsService],
  controllers: [RestaurantsController],
  exports: [RestaurantsService, TypeOrmModule],
})
export class RestaurantsModule {}
