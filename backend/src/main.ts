// ==========================================
// MAIN - ENTRY POINT DE QUIUBOLE API
// ==========================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:19006',
      'http://localhost:8081',
      configService.get('FRONTEND_URL', 'http://localhost:3000'),
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Port
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);
  console.log(`
    ╔═══════════════════════════════════════════════════╗
    ║                                                   ║
    ║   🌮 QUIUBOLE! API is running                     ║
    ║                                                   ║
    ║   URL: http://localhost:${port}                     ║
    ║   API: http://localhost:${port}/api                 ║
    ║                                                   ║
    ║   Environment: ${configService.get('NODE_ENV', 'development').padEnd(16)}          ║
    ║                                                   ║
    ╚═══════════════════════════════════════════════════╝
  `);
}

bootstrap();
