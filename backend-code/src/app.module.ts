// ==========================================
// APP MODULE - MODULO PRINCIPAL DE QUIUBOLE
// ==========================================

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Feature Modules
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { DriversModule } from './drivers/drivers.module';
import { OrdersModule } from './orders/orders.module';
import { ReviewsModule } from './reviews/reviews.module';

// Integration Modules
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { MapsModule } from './maps/maps.module';
import { UploadsModule } from './uploads/uploads.module';
import { ChatModule } from './chat/chat.module';
import { EmailModule } from './email/email.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'quiubole_user'),
        password: configService.get('DATABASE_PASSWORD', 'password'),
        database: configService.get('DATABASE_NAME', 'quiubole_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production'
          ? { rejectUnauthorized: false }
          : false,
      }),
    }),

    // Static files (uploads)
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Feature Modules
    AuthModule,
    AdminModule,
    DriversModule,
    OrdersModule,
    ReviewsModule,

    // Integration Modules
    NotificationsModule,
    PaymentsModule,
    MapsModule,
    UploadsModule,
    ChatModule,
    EmailModule,
    AiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
