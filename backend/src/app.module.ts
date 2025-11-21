import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';
import { FavoritesModule } from './favorites/favorites.module';
import { UploadModule } from './upload/upload.module';
import { PaymentsModule } from './payments/payments.module';
import { WebsocketsModule } from './websockets/websockets.module';
import { CouponsModule } from './coupons/coupons.module';
import { AddressesModule } from './addresses/addresses.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CoverageZonesModule } from './coverage-zones/coverage-zones.module';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

import { User } from './users/user.entity';
import { Restaurant } from './restaurants/restaurant.entity';
import { Category } from './categories/category.entity';
import { Product } from './products/product.entity';
import { Order } from './orders/order.entity';
import { Review } from './reviews/review.entity';
import { Favorite } from './favorites/favorite.entity';
import { Coupon } from './coupons/coupon.entity';
import { Address } from './addresses/address.entity';
import { PaymentMethod } from './payment-methods/payment-method.entity';
import { CoverageZone } from './coverage-zones/coverage-zone.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get<string>('DATABASE_USER', 'postgres'),
        password: configService.get<string>('DATABASE_PASSWORD', '74840616'),
        database: configService.get<string>('DATABASE_NAME', 'quiubole_db'),
        entities: [
          User,
          Restaurant,
          Category,
          Product,
          Order,
          Review,
          Favorite,
          Coupon,
          Address,
          PaymentMethod,
          CoverageZone,
        ],
        synchronize: true,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    RestaurantsModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    ReviewsModule,
    FavoritesModule,
    UploadModule,
    PaymentsModule,
    WebsocketsModule,
    CouponsModule,
    AddressesModule,
    PaymentMethodsModule,
    DashboardModule,
    CoverageZonesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
