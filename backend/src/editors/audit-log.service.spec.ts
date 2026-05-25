import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { EditorAuditLog } from './editor-audit-log.entity';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let insertMock: jest.Mock;

  beforeEach(async () => {
    insertMock = jest.fn().mockResolvedValue({});
    const module = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: getRepositoryToken(EditorAuditLog),
          useValue: { insert: insertMock },
        },
      ],
    }).compile();
    service = module.get(AuditLogService);
  });

  describe('diff()', () => {
    it('devuelve solo los campos que cambiaron', () => {
      const before = { name: 'Taco', price: 25, description: 'rico' };
      const after = { name: 'Taco al pastor', price: 25 };
      const diff = AuditLogService.diff(before, after);
      expect(diff.before).toEqual({ name: 'Taco' });
      expect(diff.after).toEqual({ name: 'Taco al pastor' });
    });

    it('ignora undefined en el patch (para soportar Partial DTO)', () => {
      const before = { name: 'A', price: 10 };
      const after = { name: undefined, price: 15 };
      const diff = AuditLogService.diff(before, after as any);
      expect(diff.before).toEqual({ price: 10 });
      expect(diff.after).toEqual({ price: 15 });
    });

    it('regresa objetos vacíos cuando nada cambió', () => {
      const before = { name: 'A', price: 10 };
      const after = { name: 'A', price: 10 };
      const diff = AuditLogService.diff(before, after);
      expect(diff.before).toEqual({});
      expect(diff.after).toEqual({});
    });
  });

  describe('log()', () => {
    it('persiste los cambios con los campos esperados', async () => {
      await service.log({
        userId: 'u1',
        action: 'product_updated',
        restaurantId: 'r1',
        productId: 'p1',
        changes: { before: { price: 10 }, after: { price: 15 } },
      });
      expect(insertMock).toHaveBeenCalledWith({
        userId: 'u1',
        action: 'product_updated',
        restaurantId: 'r1',
        productId: 'p1',
        changes: { before: { price: 10 }, after: { price: 15 } },
      });
    });

    it('no propaga errores del repo — el audit log no debe romper la mutación', async () => {
      insertMock.mockRejectedValueOnce(new Error('DB down'));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        service.log({ userId: 'u1', action: 'product_created' }),
      ).resolves.toBeUndefined();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
