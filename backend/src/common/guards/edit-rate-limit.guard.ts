import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';

/**
 * Rate limiter in-memory para endpoints de mutación.
 *
 * Ventana móvil de 60s, 30 requests por usuario. Pensado para frenar
 * editores/dueños que podrían automatizar cambios de precio en loop.
 *
 * NOTA: esto solo funciona single-instance. En producción reemplazar por
 * `@nestjs/throttler` con store compartido (Redis/Memcached).
 */
@Injectable()
export class EditRateLimitGuard implements CanActivate {
  private readonly WINDOW_MS = 60_000;
  private readonly MAX_REQUESTS = 30;
  private readonly hits = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.id;

    // Sin auth el JwtAuthGuard ya bloquea; este no lo repite.
    if (!userId) return true;

    const now = Date.now();
    const windowStart = now - this.WINDOW_MS;
    const timestamps = (this.hits.get(userId) ?? []).filter(
      (t) => t > windowStart,
    );

    if (timestamps.length >= this.MAX_REQUESTS) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Demasiadas ediciones en poco tiempo. Espera un momento e intenta de nuevo.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.hits.set(userId, timestamps);

    // Cleanup esporádico para que el Map no crezca indefinidamente.
    if (this.hits.size > 1000 && Math.random() < 0.05) {
      for (const [key, stamps] of this.hits) {
        if (stamps.every((t) => t <= windowStart)) {
          this.hits.delete(key);
        }
      }
    }

    return true;
  }
}
