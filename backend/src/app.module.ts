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
import { MessagesModule } from './messages/messages.module';
import { DevoCouponsModule } from './devo-coupons/devo-coupons.module';
import { DemoSeedService } from './seed/demo-seed.service';
import { AiModule } from './ai/ai.module';
import { EmailModule } from './email/email.module';
import { MailModule } from './mail/mail.module';
import { AddressesModule } from './addresses/addresses.module';
import { CouponsModule } from './coupons/coupons.module';
import { FavoritesModule } from './favorites/favorites.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { CoverageZonesModule } from './coverage-zones/coverage-zones.module';
import { EditorsModule } from './editors/editors.module';

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
import { EditorAuditLog } from './editors/editor-audit-log.entity';
import { ChatChannel } from './chat/chat-channel.entity';
import { ChatMessage } from './chat/chat-message.entity';
import { Message } from './messages/message.entity';
import { UserCoupon } from './devo-coupons/user-coupon.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // ============================================
        // CONFIG DE DB
        //
        // Soporta DOS modos:
        //   1. DATABASE_URL (Railway / Render / Heroku / Supabase) —
        //      string tipo `postgresql://user:pass@host:port/dbname`
        //   2. Vars discretas DB_HOST/DB_PORT/etc. (dev local)
        //
        // Railway añade SSL obligatorio en su Postgres público — habilitamos
        // ssl con rejectUnauthorized=false en producción para evitar errores
        // de cert self-signed (config estándar para PaaS).
        //
        // `synchronize: true` se mantiene en producción SOLO si
        // DB_SYNCHRONIZE=true está explícito. Útil en MVP para que
        // Railway cree las tablas auto al primer deploy. Cuando el
        // proyecto madure → migraciones formales.
        // ============================================
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const nodeEnv = configService.get<string>('NODE_ENV');
        const isProd = nodeEnv === 'production';
        const explicitSync =
          configService.get<string>('DB_SYNCHRONIZE') === 'true';

        const base: any = {
          type: 'postgres',
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
            EditorAuditLog,
            ChatChannel,
            ChatMessage,
            Message,
            UserCoupon,
          ],
          synchronize: !isProd || explicitSync,
          logging: nodeEnv === 'development',
        };

        if (databaseUrl) {
          return {
            ...base,
            url: databaseUrl,
            ssl: isProd ? { rejectUnauthorized: false } : false,
          };
        }

        return {
          ...base,
          host: configService.get<string>('DB_HOST') || 'localhost',
          port: configService.get<number>('DB_PORT') || 5432,
          username: configService.get<string>('DB_USERNAME') || 'postgres',
          password: configService.get<string>('DB_PASSWORD') || 'postgres',
          database: configService.get<string>('DB_DATABASE') || 'quiubole_db',
        };
      },
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
    MessagesModule,
    DevoCouponsModule,
    AiModule,
    EmailModule,
    MailModule,
    AddressesModule,
    CouponsModule,
    FavoritesModule,
    PaymentMethodsModule,
    CoverageZonesModule,
    EditorsModule,
    // El seed necesita User y Restaurant repositories que ya están en
    // sus respectivos módulos exportados. TypeOrmModule.forFeature aquí
    // los expone al provider del seed.
    TypeOrmModule.forFeature([User, Restaurant]),
  ],
  providers: [DemoSeedService],
})
export class AppModule {}
