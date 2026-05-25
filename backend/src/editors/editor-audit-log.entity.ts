import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';

export type AuditAction =
  | 'product_created'
  | 'product_updated'
  | 'product_deleted'
  | 'restaurant_updated';

/**
 * Registro inmutable de toda mutación que hace un editor (o admin) sobre
 * contenido de un restaurante. Sirve para auditoría y para mostrar al dueño
 * quién cambió qué y cuándo.
 */
@Entity('editor_audit_logs')
export class EditorAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  action: AuditAction;

  @Index()
  @Column({ nullable: true })
  restaurantId: string;

  @Index()
  @Column({ nullable: true })
  productId: string;

  /**
   * Snapshot del cambio. Forma:
   *   - create: { after: {...} }
   *   - update: { before: {...campos cambiados}, after: {...campos cambiados} }
   *   - delete: { before: {...} }
   */
  @Column({ type: 'jsonb', nullable: true })
  changes: any;

  @CreateDateColumn()
  createdAt: Date;
}
