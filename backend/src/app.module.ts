import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { ServeStaticModule } from '@nestjs/serve-static';
// import { join } from 'path';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { DriversModule } from './drivers/drivers.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UploadsModule } from './uploads/uploads.module';
import { MapsModule } from './maps/maps.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { MailModule } from './mail/mail.module';
import { AddressesModule } from './addresses/addresses.module';
import { CouponsModule } from './coupons/coupons.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { CoverageZonesModule } from './coverage-zones/coverage-zones.module';

// Entities
import { User } from './users/user.entity';
import { Restaurant } from './restaurants/restaurant.entity';
import { Product } from './products/product.entity';
import { Category } from './categories/category.entity';
import { Order } from './orders/order.entity';
import { OrderItem } from './orders/order-item.entity';
import { Review } from './reviews/review.entity';
import { Address } from './addresses/address.entity';
import { Coupon } from './coupons/coupon.entity';
import { Favorite } from './favorites/favorite.entity';
import { PaymentMethod } from './payment-methods/payment-method.entity';
import { CoverageZone } from './coverage-zones/coverage-zone.entity';
import { VerificationCode } from './auth/verification-code.entity';

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
        host: configService.get<string>('DB_HOST') || 'localhost',
        port: configService.get<number>('DB_PORT') || 5432,
        username: configService.get<string>('DB_USERNAME') || 'postgres',
        password: configService.get<string>('DB_PASSWORD') || 'postgres',
        database: configService.get<string>('DB_DATABASE') || 'quiubole_db',
        entities: [
          User,
          Restaurant,
          Product,
          Category,
          Order,
          OrderItem,
          Review,
          Address,
          Coupon,
          Favorite,
          PaymentMethod,
          CoverageZone,
          VerificationCode,
        ],
        synchronize: configService.get<string>('NODE_ENV') !== 'production',
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'uploads'),
    //   serveRoot: '/uploads',
    // }),
    // Feature modules
    AuthModule,
    UsersModule,
    RestaurantsModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    DriversModule,
    AdminModule,
    PaymentsModule,
    NotificationsModule,
    ReviewsModule,
    UploadsModule,
    MapsModule,
    ChatModule,
    AiModule,
    EmailModule,
    MailModule,
    AddressesModule,
    CouponsModule,
    FavoritesModule,
    PaymentMethodsModule,
    CoverageZonesModule,
  ],
})
export class AppModule {}
