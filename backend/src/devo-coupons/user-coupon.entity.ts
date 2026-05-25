// ==========================================
// UserCoupon — cupón Devo personal e intransferible
//
// A diferencia del `Coupon` legacy (códigos promocionales globales),
// cada UserCoupon está atado a un userId específico, lo creó el admin
// en respuesta a que el cliente cruzó un umbral de 100 puntos Devo, y
// solo ese user puede usarlo. Una vez redimido queda marcado y no se
// puede reutilizar.
//
// Flujo:
//   1. Cliente pide → orden delivered → +10 pts
//   2. Cada 100 pts → sistema crea UserCoupon con status='pending_admin'
//   3. Admin lo recibe en su bandeja → asigna type/value/etc → status='active'
//   4. Cliente lo aplica en checkout → status='redeemed'
// ==========================================

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { Restaurant } from '../restaurants/restaurant.entity';

export type UserCouponStatus = 'pending_admin' | 'active' | 'redeemed' | 'expired';
export type UserCouponType =
  | 'percentage' // % off subtotal (capped by maxDiscount)
  | 'fixed' // monto fijo de descuento
  | 'free_delivery' // delivery fee = 0
  | 'product_discount'; // descuento aplicado a producto específico
export type UserCouponSource = 'points_threshold' | 'admin_gift' | 'campaign';

@Entity('user_coupons')
@Index(['userId', 'status'])
export class UserCoupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Código corto legible (DEVO-XXXXXX) generado al crear. No se reutiliza.
  @Column({ unique: true })
  code: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * pending_admin: creado por el sistema al cruzar 100 pts, esperando que
   *   admin defina tipo/valor. Cliente lo ve como "tu próximo cupón está
   *   siendo preparado".
   * active: admin ya lo asignó, cliente puede usarlo.
   * redeemed: ya se usó en una orden.
   * expired: pasó la fecha de expiración sin usar.
   */
  @Column({
    type: 'enum',
    enum: ['pending_admin', 'active', 'redeemed', 'expired'],
    default: 'pending_admin',
  })
  status: UserCouponStatus;

  // Quedan NULL mientras status='pending_admin'. Admin los define al asignar.
  @Column({
    type: 'enum',
    enum: ['percentage', 'fixed', 'free_delivery', 'product_discount'],
    nullable: true,
  })
  type: UserCouponType | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number | null;

  // Para type=percentage: tope máximo de descuento en pesos.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscount: number | null;

  // Subtotal mínimo del pedido para aplicar el cupón.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderAmount: number | null;

  // Si está scopeado a un restaurante específico, solo aplica ahí.
  @Column({ nullable: true })
  restaurantId: string | null;

  @ManyToOne(() => Restaurant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant | null;

  // Si está scopeado a un producto, aplica solo si ese producto está en el carrito.
  @Column({ nullable: true })
  productId: string | null;

  // Descripción legible que el cliente ve en su wallet ("20% off en pizzas").
  @Column({ nullable: true })
  description: string | null;

  // Fecha de expiración. NULL = sin expiración.
  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  // De dónde vino. 'points_threshold' = sistema lo creó al cruzar 100 pts.
  @Column({
    type: 'enum',
    enum: ['points_threshold', 'admin_gift', 'campaign'],
    default: 'points_threshold',
  })
  source: UserCouponSource;

  // Quién (admin) lo asignó. NULL hasta que admin lo configure.
  @Column({ nullable: true })
  adminAssignedById: string | null;

  @Column({ type: 'timestamp', nullable: true })
  assignedAt: Date | null;

  // Si ya se redimió, qué orden lo usó.
  @Column({ nullable: true })
  redeemedOrderId: string | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'redeemedOrderId' })
  redeemedOrder: Order | null;

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date | null;

  // Monto exacto de descuento aplicado al redimir (snapshot histórico).
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  redeemedDiscount: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
