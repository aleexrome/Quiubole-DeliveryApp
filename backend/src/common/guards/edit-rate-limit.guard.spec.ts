import { ExecutionContext, HttpException } from '@nestjs/common';
import { EditRateLimitGuard } from './edit-rate-limit.guard';

function makeContext(userId?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: userId ? { id: userId } : undefined }),
    }),
  } as any;
}

describe('EditRateLimitGuard', () => {
  let guard: EditRateLimitGuard;

  beforeEach(() => {
    guard = new EditRateLimitGuard();
  });

  it('deja pasar cuando no hay usuario autenticado (JwtAuthGuard ya bloquea)', () => {
    expect(guard.canActivate(makeContext(undefined))).toBe(true);
  });

  it('permite hasta 30 requests dentro de la ventana', () => {
    const ctx = makeContext('user-a');
    for (let i = 0; i < 30; i++) {
      expect(guard.canActivate(ctx)).toBe(true);
    }
  });

  it('bloquea el request 31 con 429', () => {
    const ctx = makeContext('user-a');
    for (let i = 0; i < 30; i++) guard.canActivate(ctx);
    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
    try {
      guard.canActivate(ctx);
    } catch (e: any) {
      expect(e.getStatus()).toBe(429);
    }
  });

  it('aísla contadores por usuario', () => {
    const ctxA = makeContext('user-a');
    const ctxB = makeContext('user-b');
    for (let i = 0; i < 30; i++) guard.canActivate(ctxA);
    expect(() => guard.canActivate(ctxA)).toThrow();
    // user-b debe poder seguir
    expect(guard.canActivate(ctxB)).toBe(true);
  });

  it('libera el contador cuando pasa la ventana de 60s', () => {
    const ctx = makeContext('user-c');
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
    for (let i = 0; i < 30; i++) guard.canActivate(ctx);
    expect(() => guard.canActivate(ctx)).toThrow();

    // Avanzamos 61s → timestamps viejos caen fuera de la ventana.
    nowSpy.mockReturnValue(1_000_000 + 61_000);
    expect(guard.canActivate(ctx)).toBe(true);
    nowSpy.mockRestore();
  });
});
