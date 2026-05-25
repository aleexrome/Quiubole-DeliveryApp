// ==========================================
// MessagesController
//
// REST endpoints para el chat por pedido. Todos requieren JWT.
//
//   GET    /messages/order/:orderId            — mensajes (con ?with=userId)
//   GET    /messages/order/:orderId/participants — otros usuarios del pedido
//   POST   /messages                            — enviar { orderId, toUserId, text }
//   PATCH  /messages/:id/read                   — marcar leído
//   GET    /messages/unread-count               — total no leídos del usuario
// ==========================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { IsString, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class SendMessageDto {
  @IsUUID()
  orderId: string;

  @IsUUID()
  toUserId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  text: string;
}

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.service.getUnreadCount(req.user.id);
    return { count };
  }

  @Get('order/:orderId/participants')
  async getParticipants(
    @Param('orderId') orderId: string,
    @Request() req: any,
  ) {
    return this.service.getOrderChatParticipants(orderId, req.user.id);
  }

  @Get('order/:orderId')
  async getMessages(
    @Param('orderId') orderId: string,
    @Query('with') otherUserId: string | undefined,
    @Request() req: any,
  ) {
    return this.service.getMessages(orderId, req.user.id, otherUserId);
  }

  @Post()
  async sendMessage(@Body() dto: SendMessageDto, @Request() req: any) {
    return this.service.sendMessage(
      dto.orderId,
      req.user.id,
      dto.toUserId,
      dto.text,
    );
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Request() req: any) {
    await this.service.markRead(id, req.user.id);
    return { ok: true };
  }
}
