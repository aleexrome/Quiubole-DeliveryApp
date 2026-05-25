// ==========================================
// DevoCouponsService
//
// Sistema de lealtad puntos → cupones. Funciones principales:
//   - awardPointsForOrder(): suma 10 pts al cliente y crea pending coupon
//     cada vez que cruza un múltiplo de 100. Se llama desde orders.service
//     cuando una orden pasa a DELIVERED.
//   - listMine(): devuelve los cupones del usuario logueado + balance pts.
//   - listPendingForAdmin(): cupones pending_admin esperando ser configurados.
//   - assignCoupon(): admin define type/value/scope y activa el cupón.
//   - previewDiscount(): calcula descuento sin marcar como usado (preview en
//     checkout antes de confirmar).
//   - redeem(): marca el cupón como redimido al confirmar la orden.
//   - refund(): si una orden se cancela, devolver el cupón a estado activo.
// ==========================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In, Not, LessThan } from 'typeorm';
import { UserCoupon, UserCouponType } from './user-coupon.entity';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';

const POINTS_PER_ORDER = 10;
const POINTS_PER_COUPON = 100;

@Injectable()
export class DevoCouponsService {
  constructor(
    @InjectRepository(UserCoupon)
    private readonly couponsRepo: Repository<UserCoupon>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Llamado desde orders.service al marcar una orden como DELIVERED.
   * Suma 10 pts y, si el balance acumulado cruza un múltiplo de 100,
   * crea un UserCoupon en estado pending_admin para que admin lo configure.
   */
  async awardPointsForOrder(userId: string, orderId: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;

    const before = Number(user.devoPoints) || 0;
    const lifetime = Number(user.devoPointsLifetime) || 0;
    const after = before + POINTS_PER_ORDER;
    const lifetimeAfter = lifetime + POINTS_PER_ORDER;

    await this.usersRepo.update(userId, {
      devoPoints: after,
      devoPointsLifetime: lifetimeAfter,
    });

    // ¿Cruzamos un múltiplo de 100? Ej. 95 → 105 cruza 100.
    const couponsToCreate =
      Math.floor(after / POINTS_PER_COUPON) -
      Math.floor(before / POINTS_PER_COUPON);

    if (couponsToCreate <= 0) return;

    for (let i = 0; i < couponsToCreate; i++) {
      const code = this.generateCode();
      const newCoupon = this.couponsRepo.create({
        code,
        userId,
        status: 'pending_admin',
        source: 'points_threshold',
      });
      await this.couponsRepo.save(newCoupon);

      // Notificar al cliente que va a recibir un cupón pronto.
      try {
        await this.notifications.sendPushNotification(
          userId,
          '🎁 Estás a punto de recibir un cupón Devo',
          'Cruzaste los 100 puntos. Nuestro equipo te asignará un cupón en breve.',
          { type: 'devo_coupon_pending', couponId: newCoupon.id },
        );
      } catch {
        /* silent */
      }

      // Notificar a todos los admins que hay un cupón nuevo por asignar.
      try {
        const admins = await this.usersRepo.find({
          where: { role: UserRole.ADMIN, isActive: true },
        });
        const userName =
          [user.firstName, user.lastName].filter(Boolean).join(' ') ||
          user.name ||
          'Un cliente';
        await Promise.all(
          admins.map((a) =>
            this.notifications.sendPushNotification(
              a.id,
              '✨ Nuevo cupón pendiente',
              `${userName} llegó a 100 pts. Asígnale un cupón Devo.`,
              { type: 'devo_coupon_admin_pending', couponId: newCoupon.id },
            ),
          ),
        );
      } catch {
        /* silent */
      }

      void orderId; // por si más adelante queremos relacionar al order origen
    }
  }

  /** Lista cupones del usuario + balance de pts. */
  async listMine(
    userId: string,
  ): Promise<{ points: number; lifetime: number; coupons: UserCoupon[] }> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Auto-expira los que ya pasaron su fecha.
    await this.couponsRepo
      .createQueryBuilder()
      .update(UserCoupon)
      .set({ status: 'expired' })
      .where('userId = :userId', { userId })
      .andWhere('status = :status', { status: 'active' })
      .andWhere('expiresAt IS NOT NULL AND expiresAt < NOW()')
      .execute();

    const coupons = await this.couponsRepo.find({
      where: { userId },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });

    return {
      points: Number(user.devoPoints) || 0,
      lifetime: Number(user.devoPointsLifetime) || 0,
      coupons,
    };
  }

  /** Admin: cupones pendientes de definir type/value. */
  async listPendingForAdmin(): Promise<UserCoupon[]> {
    return this.couponsRepo.find({
      where: { status: 'pending_admin' },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  /** Admin define type/value/scope/expiración y activa el cupón. */
  async assignCoupon(
    couponId: string,
    adminId: string,
    data: {
      type: UserCouponType;
      value: number;
      maxDiscount?: number | null;
      minOrderAmount?: number | null;
      restaurantId?: string | null;
      productId?: string | null;
      description?: string | null;
      expiresAt?: string | null;
    },
  ): Promise<UserCoupon> {
    const coupon = await this.couponsRepo.findOne({
      where: { id: couponId },
      relations: ['user'],
    });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    if (coupon.status !== 'pending_admin') {
      throw new BadRequestException(
        'Este cupón ya fue asignado o redimido',
      );
    }

    // Validaciones por type.
    if (data.type === 'percentage') {
      if (data.value < 1 || data.value > 100) {
        throw new BadRequestException('El % debe estar entre 1 y 100');
      }
    } else if (data.type === 'fixed') {
      if (data.value <= 0) {
        throw new BadRequestException('El monto debe ser positivo');
      }
    } else if (data.type === 'product_discount') {
      if (!data.productId) {
        throw new BadRequestException(
          'product_discount requiere productId',
        );
      }
    }

    coupon.type = data.type;
    coupon.value = data.value;
    coupon.maxDiscount = data.maxDiscount ?? null;
    coupon.minOrderAmount = data.minOrderAmount ?? null;
    coupon.restaurantId = data.restaurantId ?? null;
    coupon.productId = data.productId ?? null;
    coupon.description = data.description ?? this.buildDescription(data);
    coupon.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    coupon.status = 'active';
    coupon.adminAssignedById = adminId;
    coupon.assignedAt = new Date();

    const saved = await this.couponsRepo.save(coupon);

    // Notifica al cliente que ya puede usar su cupón.
    try {
      await this.notifications.sendPushNotification(
        coupon.userId,
        '🎉 ¡Tienes un cupón Devo!',
        coupon.description || 'Aplícalo en tu próximo pedido.',
        { type: 'devo_coupon_assigned', couponId: coupon.id },
      );
    } catch {
      /* silent */
    }

    return saved;
  }

  /**
   * Preview: calcula el descuento que el cupón aplicaría a un subtotal,
   * sin marcar como redimido. Se llama desde el frontend de checkout.
   */
  async previewDiscount(
    couponId: string,
    userId: string,
    subtotal: number,
    deliveryFee: number,
    restaurantId: string,
    productIds: string[] = [],
  ): Promise<{ discount: number; deliveryDiscount: number; reason?: string }> {
    const coupon = await this.couponsRepo.findOne({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    if (coupon.userId !== userId) {
      throw new ForbiddenException('Este cupón no es tuyo');
    }
    if (coupon.status !== 'active') {
      throw new BadRequestException(
        coupon.status === 'pending_admin'
          ? 'Este cupón aún está siendo preparado'
          : coupon.status === 'redeemed'
            ? 'Este cupón ya fue usado'
            : 'Este cupón expiró',
      );
    }
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestException('Este cupón expiró');
    }
    if (coupon.minOrderAmount && subtotal < Number(coupon.minOrderAmount)) {
      throw new BadRequestException(
        `Pedido mínimo: $${Number(coupon.minOrderAmount).toFixed(2)}`,
      );
    }
    if (coupon.restaurantId && coupon.restaurantId !== restaurantId) {
      throw new BadRequestException(
        'Este cupón solo aplica en un restaurante específico',
      );
    }
    if (
      coupon.productId &&
      !productIds.includes(coupon.productId)
    ) {
      throw new BadRequestException(
        'Este cupón requiere un producto específico en tu pedido',
      );
    }

    let discount = 0;
    let deliveryDiscount = 0;

    if (coupon.type === 'percentage') {
      discount = subtotal * (Number(coupon.value) / 100);
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else if (coupon.type === 'fixed' || coupon.type === 'product_discount') {
      discount = Math.min(Number(coupon.value), subtotal);
    } else if (coupon.type === 'free_delivery') {
      deliveryDiscount = Number(deliveryFee) || 0;
    }

    return { discount, deliveryDiscount };
  }

  /** Marca el cupón como redimido al confirmar la orden. */
  async redeem(
    couponId: string,
    userId: string,
    orderId: string,
    discountApplied: number,
  ): Promise<UserCoupon> {
    const coupon = await this.couponsRepo.findOne({ where: { id: couponId } });
    if (!coupon) throw new NotFoundException('Cupón no encontrado');
    if (coupon.userId !== userId) {
      throw new ForbiddenException('Este cupón no es tuyo');
    }
    if (coupon.status !== 'active') {
      throw new BadRequestException('Cupón no disponible para redimir');
    }
    coupon.status = 'redeemed';
    coupon.redeemedOrderId = orderId;
    coupon.redeemedAt = new Date();
    coupon.redeemedDiscount = discountApplied;
    return this.couponsRepo.save(coupon);
  }

  /** Si la orden se cancela, devolver el cupón a estado activo. */
  async refund(orderId: string): Promise<void> {
    const coupon = await this.couponsRepo.findOne({
      where: { redeemedOrderId: orderId },
    });
    if (!coupon) return;
    coupon.status = 'active';
    coupon.redeemedOrderId = null;
    coupon.redeemedAt = null;
    coupon.redeemedDiscount = null;
    await this.couponsRepo.save(coupon);
  }

  // ============================================
  // HELPERS
  // ============================================

  private generateCode(): string {
    // DEVO-XXXXXX (6 chars alfanuméricos en mayúscula sin O/0/I/1 para evitar
    // ambigüedad visual cuando el cliente lo lea).
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `DEVO-${suffix}`;
  }

  private buildDescription(data: {
    type: UserCouponType;
    value: number;
    maxDiscount?: number | null;
  }): string {
    if (data.type === 'percentage') {
      return `${data.value}% de descuento${data.maxDiscount ? ` (hasta $${data.maxDiscount})` : ''}`;
    }
    if (data.type === 'fixed') {
      return `$${data.value} de descuento`;
    }
    if (data.type === 'free_delivery') {
      return 'Envío gratis';
    }
    if (data.type === 'product_discount') {
      return `$${data.value} de descuento en producto especial`;
    }
    return 'Cupón Devo';
  }
}
