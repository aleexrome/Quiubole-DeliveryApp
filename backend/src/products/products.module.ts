import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { OrderItem } from '../orders/order-item.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { EditorsModule } from '../editors/editors.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, OrderItem]),
    forwardRef(() => EditorsModule),
    NotificationsModule,
  ],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
