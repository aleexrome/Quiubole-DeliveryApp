import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, EditorAuditLog } from './editor-audit-log.entity';

interface LogParams {
  userId: string;
  action: AuditAction;
  restaurantId?: string;
  productId?: string;
  changes?: any;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(EditorAuditLog)
    private readonly logsRepo: Repository<EditorAuditLog>,
  ) {}

  /**
   * Inserta una fila de auditoría. Silencia errores para no romper la
   * mutación principal (el audit log nunca debe bloquear el flujo).
   */
  async log(params: LogParams): Promise<void> {
    try {
      await this.logsRepo.insert({
        userId: params.userId,
        action: params.action,
        restaurantId: params.restaurantId,
        productId: params.productId,
        changes: params.changes ?? null,
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[AuditLog] failed to persist:', err);
    }
  }

  /** Compara dos objetos y devuelve solo los campos que cambiaron. */
  static diff<T extends Record<string, any>>(
    before: T,
    after: Partial<T>,
  ): { before: Partial<T>; after: Partial<T> } {
    const changedBefore: Partial<T> = {};
    const changedAfter: Partial<T> = {};
    for (const key of Object.keys(after) as (keyof T)[]) {
      const newVal = after[key];
      const oldVal = before[key];
      if (newVal !== undefined && newVal !== oldVal) {
        changedBefore[key] = oldVal;
        changedAfter[key] = newVal;
      }
    }
    return { before: changedBefore, after: changedAfter };
  }
}
