import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Logger ya viene incluido — solo bajamos verbose en producción.
    logger:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['log', 'warn', 'error', 'debug', 'verbose'],
  });

  // ============================================
  // CORS
  //
  // Por default permite cualquier origen (origin: true). En producción
  // se puede restringir vía env CORS_ORIGIN (CSV con dominios) para
  // mayor seguridad — útil cuando agregamos un dashboard web.
  // ============================================
  const corsOriginEnv = process.env.CORS_ORIGIN;
  const corsOrigin = corsOriginEnv
    ? corsOriginEnv.split(',').map((o) => o.trim())
    : true;
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // ============================================
  // HEALTH CHECK
  //
  // Endpoint público GET /health usado por Railway/Render/load-balancers
  // para verificar que la app está viva. No usa el prefix /api porque
  // muchos proveedores esperan /health a la raíz.
  // ============================================
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/health', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  });

  // ============================================
  // PUERTO
  //
  // En Railway/Render/Heroku el host inyecta PORT via env.
  // En local default 4000 (3000 suele estar ocupado por iphlpsvc en
  // Windows, lo que fuerza bind solo a IPv6 y rompe el emulador).
  // ============================================
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port, '0.0.0.0');

  // eslint-disable-next-line no-console
  console.log(
    `🚀 Devolón API listening on :${port} (${
      process.env.NODE_ENV || 'development'
    })`,
  );
}

bootstrap();
