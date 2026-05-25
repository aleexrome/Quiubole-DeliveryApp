import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

class SendMessageDto {
  @IsString() @MinLength(1) body: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  /** Lista canales donde participa el usuario (editor o dueño). */
  @Get('channels')
  async listChannels(@CurrentUser() user: any) {
    return this.chat.listForUser(user.id, user.role as UserRole);
  }

  /** Número total de mensajes no leídos del usuario. */
  @Get('unread-count')
  async unreadCount(@CurrentUser() user: any) {
    const count = await this.chat.getUnreadCount(
      user.id,
      user.role as UserRole,
    );
    return { count };
  }

  /** Historial de mensajes de un canal (descendente, paginado por timestamp). */
  @Get('channels/:id/messages')
  async getMessages(
    @Param('id') channelId: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.chat.getMessages(channelId, user.id, user.role as UserRole, {
      limit: limit ? Number(limit) : undefined,
      before: before ? new Date(before) : undefined,
    });
  }

  /** Envía un mensaje. Dispara push al destinatario. */
  @Post('channels/:id/messages')
  async sendMessage(
    @Param('id') channelId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: any,
  ) {
    return this.chat.sendMessage(
      channelId,
      user.id,
      user.role as UserRole,
      dto.body,
    );
  }
}
