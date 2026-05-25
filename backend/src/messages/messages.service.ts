// ==========================================
// MessagesService — chat por pedido (customer ↔ driver ↔ restaurant)
//
// Diferente del legacy `chat` module (que es editor ↔ restaurant owner).
// Este sistema está atado a un Order: cualquier participante del pedido
// puede mandar mensajes a cualquier otro participante.
//
// Participantes de un order:
//   - customer (order.customerId)
//   - driver (order.driverId, si fue asignado)
//   - restaurant owner (order.restaurant.ownerId)
//
// Reglas:
//   - El usuario que llama debe ser uno de los 3 participantes.
//   - El destinatario (toUserId) también debe ser uno de los participantes.
//   - Una vez delivered o cancelled, el chat queda read-only.
// ==========================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull, Not } from 'typeorm';
import { Message } from './message.entity';
import { Order } from '../orders/order.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    private readonly notifications: NotificationsService,
  ) {}

  /** Resuelve los IDs de los 3 participantes del pedido (customer, driver, restaurantOwner). */
  private async getParticipants(orderId: string): Promise<{
    order: Order;
    participants: { customerId: string | null; driverId: string | null; ownerId: string | null };
  }> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId },
      relations: ['restaurant'],
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');

    const ownerId = (order.restaurant as any)?.ownerId ?? null;
    return {
      order,
      participants: {
        customerId: order.customerId ?? null,
        driverId: order.driverId ?? null,
        ownerId,
      },
    };
  }

  private assertParticipant(
    userId: string,
    participants: { customerId: string | null; driverId: string | null; ownerId: string | null },
  ): 'customer' | 'driver' | 'restaurant' {
    if (participants.customerId === userId) return 'customer';
    if (participants.driverId === userId) return 'driver';
    if (participants.ownerId === userId) return 'restaurant';
    throw new ForbiddenException('No participas en este pedido');
  }

  /**
   * Mensajes entre el usuario actual y otro participante específico para
   * un pedido. Si `otherUserId` no se da, devuelve TODOS los mensajes
   * donde el usuario actual es emisor o receptor (vista bandeja).
   */
  async getMessages(
    orderId: string,
    meId: string,
    otherUserId?: string,
  ): Promise<Message[]> {
    const { participants } = await this.getParticipants(orderId);
    this.assertParticipant(meId, participants);

    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .where('m.orderId = :orderId', { orderId });

    if (otherUserId) {
      qb.andWhere(
        '((m.fromUserId = :me AND m.toUserId = :other) OR (m.fromUserId = :other AND m.toUserId = :me))',
        { me: meId, other: otherUserId },
      );
    } else {
      qb.andWhere('(m.fromUserId = :me OR m.toUserId = :me)', { me: meId });
    }

    const messages = await qb.orderBy('m.createdAt', 'ASC').getMany();

    // Marca como leídos los que llegaron AL usuario actual.
    const unreadIncomingIds = messages
      .filter((m) => m.toUserId === meId && !m.readAt)
      .map((m) => m.id);
    if (unreadIncomingIds.length > 0) {
      await this.messagesRepo.update(
        { id: In(unreadIncomingIds) },
        { readAt: new Date() },
      );
    }

    return messages;
  }

  async sendMessage(
    orderId: string,
    fromUserId: string,
    toUserId: string,
    text: string,
  ): Promise<Message> {
    const trimmed = (text ?? '').trim();
    if (!trimmed) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }
    if (trimmed.length > 1000) {
      throw new BadRequestException('Mensaje demasiado largo (máx 1000)');
    }

    const { order, participants } = await this.getParticipants(orderId);

    // Pedido cerrado → chat read-only.
    if (
      order.status === OrderStatus.DELIVERED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'El pedido ya está cerrado, no se pueden enviar mensajes.',
      );
    }

    const fromSide = this.assertParticipant(fromUserId, participants);

    // Validar destinatario: debe ser uno de los otros 2 participantes.
    const validRecipients = [
      participants.customerId,
      participants.driverId,
      participants.ownerId,
    ].filter((id): id is string => !!id && id !== fromUserId);

    if (!validRecipients.includes(toUserId)) {
      throw new ForbiddenException(
        'Destinatario inválido para este pedido',
      );
    }

    const message = this.messagesRepo.create({
      orderId,
      fromUserId,
      toUserId,
      text: trimmed,
    });
    const saved = await this.messagesRepo.save(message);

    // Push al destinatario.
    const senderLabelByRole = {
      customer: 'Cliente',
      driver: 'Repartidor',
      restaurant: 'Restaurante',
    } as const;
    const title = `${senderLabelByRole[fromSide]} · ${order.orderNumber}`;
    try {
      await this.notifications.sendPushNotification(
        toUserId,
        title,
        trimmed.slice(0, 140),
        {
          type: 'order_message',
          orderId,
          fromUserId,
          messageId: saved.id,
        },
      );
    } catch {
      /* silent — fallo de push no debe romper el envío */
    }

    return saved;
  }

  /** Cuántos mensajes sin leer tiene el usuario en cualquier pedido. */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messagesRepo.count({
      where: { toUserId: userId, readAt: IsNull() as any },
    });
  }

  /** Marca un mensaje específico como leído (idempotente). */
  async markRead(messageId: string, userId: string): Promise<void> {
    const msg = await this.messagesRepo.findOne({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Mensaje no encontrado');
    if (msg.toUserId !== userId) {
      throw new ForbiddenException('No es tu mensaje para marcar leído');
    }
    if (!msg.readAt) {
      await this.messagesRepo.update(messageId, { readAt: new Date() });
    }
  }

  /**
   * Helper para el frontend: devuelve los IDs+roles de los participantes
   * de un pedido (sin el caller). Sirve para que la UI sepa con quién
   * puede chatear sin tener que adivinar.
   */
  async getOrderChatParticipants(
    orderId: string,
    meId: string,
  ): Promise<
    Array<{ userId: string; role: 'customer' | 'driver' | 'restaurant' }>
  > {
    const { order, participants } = await this.getParticipants(orderId);
    this.assertParticipant(meId, participants);

    const list: Array<{ userId: string; role: 'customer' | 'driver' | 'restaurant' }> = [];
    if (participants.customerId && participants.customerId !== meId) {
      list.push({ userId: participants.customerId, role: 'customer' });
    }
    if (participants.driverId && participants.driverId !== meId) {
      list.push({ userId: participants.driverId, role: 'driver' });
    }
    if (participants.ownerId && participants.ownerId !== meId) {
      list.push({ userId: participants.ownerId, role: 'restaurant' });
    }
    // Silencio el warning de variable no usada (order se mantiene por si
    // el caller quiere logs o auditoría futura).
    void order;
    return list;
  }
}
