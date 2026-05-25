import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ChatChannel } from './chat-channel.entity';
import { ChatMessage } from './chat-message.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatChannel)
    private readonly channelsRepo: Repository<ChatChannel>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepo: Repository<ChatMessage>,
    @InjectRepository(Restaurant)
    private readonly restaurantsRepo: Repository<Restaurant>,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Crea el canal si no existe. Idempotente — reasignar el mismo editor al
   * mismo restaurante no genera duplicado.
   */
  async ensureChannel(
    restaurantId: string,
    editorId: string,
  ): Promise<ChatChannel> {
    const existing = await this.channelsRepo.findOne({
      where: { restaurantId, editorId },
    });
    if (existing) return existing;

    const restaurant = await this.restaurantsRepo.findOne({
      where: { id: restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const channel = this.channelsRepo.create({
      restaurantId,
      editorId,
      ownerId: restaurant.ownerId,
    });
    return this.channelsRepo.save(channel);
  }

  /**
   * Lista canales donde el usuario participa (como editor o como dueño).
   * El admin ve todos los canales.
   */
  async listForUser(userId: string, role: UserRole): Promise<ChatChannel[]> {
    const qb = this.channelsRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.restaurant', 'restaurant')
      .leftJoinAndSelect('c.editor', 'editor')
      .leftJoinAndSelect('c.owner', 'owner')
      .orderBy('c.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('c.createdAt', 'DESC');

    if (role !== UserRole.ADMIN) {
      qb.where('c.editorId = :userId OR c.ownerId = :userId', { userId });
    }

    return qb.getMany();
  }

  /**
   * Valida que el usuario pueda ver/escribir en el canal y devuelve su rol
   * dentro del mismo ('editor' | 'owner' | 'admin').
   */
  async assertParticipant(
    channelId: string,
    userId: string,
    role: UserRole,
  ): Promise<{ channel: ChatChannel; side: 'editor' | 'owner' | 'admin' }> {
    const channel = await this.channelsRepo.findOne({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('Canal no encontrado');

    if (role === UserRole.ADMIN) {
      return { channel, side: 'admin' };
    }
    if (channel.editorId === userId) return { channel, side: 'editor' };
    if (channel.ownerId === userId) return { channel, side: 'owner' };
    throw new ForbiddenException('No perteneces a este canal');
  }

  async getMessages(
    channelId: string,
    userId: string,
    role: UserRole,
    opts?: { limit?: number; before?: Date },
  ): Promise<ChatMessage[]> {
    const { side } = await this.assertParticipant(channelId, userId, role);

    const limit = Math.min(opts?.limit ?? 50, 200);
    const where: any = { channelId };
    if (opts?.before) where.createdAt = LessThan(opts.before);

    const messages = await this.messagesRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });

    // Marca como leídas las del otro lado al consultar.
    if (side === 'editor' || side === 'owner') {
      const field = side === 'editor' ? 'readByEditor' : 'readByOwner';
      await this.messagesRepo
        .createQueryBuilder()
        .update(ChatMessage)
        .set({ [field]: true })
        .where('channelId = :channelId', { channelId })
        .andWhere(`${field} = false`)
        .execute();
    }

    return messages.reverse(); // cliente espera ascendente
  }

  async sendMessage(
    channelId: string,
    userId: string,
    role: UserRole,
    body: string,
  ): Promise<ChatMessage> {
    const { channel, side } = await this.assertParticipant(
      channelId,
      userId,
      role,
    );

    const trimmed = body.trim();
    if (!trimmed) {
      throw new NotFoundException('El mensaje no puede estar vacío');
    }

    // Determina remitente y destinatario — solo editor/owner pueden enviar.
    // Si el admin quisiera, habría que registrarlo como uno de los dos lados.
    if (side === 'admin') {
      throw new ForbiddenException(
        'El admin puede observar pero no enviar mensajes.',
      );
    }

    const readByEditor = side === 'editor';
    const readByOwner = side === 'owner';

    const msg = this.messagesRepo.create({
      channelId,
      senderId: userId,
      body: trimmed,
      readByEditor,
      readByOwner,
    });
    const saved = await this.messagesRepo.save(msg);

    // Actualiza timestamp del canal para ordenar lista.
    await this.channelsRepo.update(channelId, { lastMessageAt: new Date() });

    // Push al otro lado.
    const recipient =
      side === 'editor' ? channel.ownerId : channel.editorId;
    if (recipient) {
      await this.notifications.sendPushNotification(
        recipient,
        side === 'editor'
          ? 'Nuevo mensaje de tu editor'
          : 'Nuevo mensaje del restaurante',
        trimmed.slice(0, 140),
        {
          type: 'chat_message',
          channelId,
          restaurantId: channel.restaurantId,
        },
      );
    }

    return saved;
  }

  /** Conteo de mensajes sin leer del usuario (sumado sobre todos sus canales). */
  async getUnreadCount(userId: string, role: UserRole): Promise<number> {
    if (role === UserRole.ADMIN) return 0;

    const field = role === UserRole.EDITOR ? 'readByEditor' : 'readByOwner';
    const side = role === UserRole.EDITOR ? 'editorId' : 'ownerId';

    const result = await this.messagesRepo
      .createQueryBuilder('m')
      .innerJoin('m.channel', 'c')
      .where(`c.${side} = :userId`, { userId })
      .andWhere(`m.${field} = false`)
      .andWhere('m.senderId != :userId', { userId })
      .getCount();

    return result;
  }
}
