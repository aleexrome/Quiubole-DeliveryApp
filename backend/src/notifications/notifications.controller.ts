// ==========================================
// NOTIFICATIONS CONTROLLER
// ==========================================

import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

// DTOs
class RegisterTokenDto {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

class SendNotificationDto {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

class SendBulkNotificationDto {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

class SendTopicNotificationDto {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

class SubscribeTopicDto {
  token: string;
  topic: string;
}

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  // ==========================================
  // REGISTRO DE TOKENS (Usuarios autenticados)
  // ==========================================

  @Post('register-token')
  @UseGuards(JwtAuthGuard)
  async registerToken(@Request() req, @Body() body: RegisterTokenDto) {
    return this.notificationsService.registerDeviceToken(
      req.user.id,
      body.token,
      body.platform,
    );
  }

  @Delete('remove-token')
  @UseGuards(JwtAuthGuard)
  async removeToken(@Request() req, @Body('token') token: string) {
    return this.notificationsService.removeDeviceToken(req.user.id, token);
  }

  // ==========================================
  // SUSCRIPCIÓN A TÓPICOS
  // ==========================================

  @Post('subscribe-topic')
  @UseGuards(JwtAuthGuard)
  async subscribeToTopic(@Body() body: SubscribeTopicDto) {
    return this.notificationsService.subscribeToTopic(body.token, body.topic);
  }

  @Post('unsubscribe-topic')
  @UseGuards(JwtAuthGuard)
  async unsubscribeFromTopic(@Body() body: SubscribeTopicDto) {
    return this.notificationsService.unsubscribeFromTopic(body.token, body.topic);
  }

  // ==========================================
  // ENVÍO DE NOTIFICACIONES (Solo Admin)
  // ==========================================

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async sendNotification(@Body() body: SendNotificationDto) {
    return this.notificationsService.sendToUser(
      body.userId,
      body.title,
      body.body,
      body.data,
    );
  }

  @Post('send-bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async sendBulkNotification(@Body() body: SendBulkNotificationDto) {
    return this.notificationsService.sendToMultipleUsers(
      body.userIds,
      body.title,
      body.body,
      body.data,
    );
  }

  @Post('send-topic')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async sendTopicNotification(@Body() body: SendTopicNotificationDto) {
    return this.notificationsService.sendToTopic(
      body.topic,
      body.title,
      body.body,
      body.data,
    );
  }

  // ==========================================
  // NOTIFICACIONES DE PRUEBA (Solo desarrollo)
  // ==========================================

  @Post('test')
  @UseGuards(JwtAuthGuard)
  async sendTestNotification(@Request() req) {
    return this.notificationsService.sendToUser(
      req.user.id,
      '¡Notificación de Prueba!',
      'Si ves esto, las notificaciones funcionan correctamente.',
      { type: 'test' },
    );
  }

  // ==========================================
  // PROMOCIONES (Admin)
  // ==========================================

  @Post('promotion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async sendPromotion(
    @Body()
    body: {
      userIds: string[];
      title: string;
      message: string;
      promoCode?: string;
    },
  ) {
    return this.notificationsService.sendPromotion(
      body.userIds,
      body.title,
      body.message,
      body.promoCode,
    );
  }

  // Enviar promoción a todos los clientes
  @Post('promotion/all-customers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async sendPromotionToAllCustomers(
    @Body()
    body: {
      title: string;
      message: string;
      promoCode?: string;
    },
  ) {
    // Enviar a tópico de clientes
    return this.notificationsService.sendToTopic(
      'customers',
      body.title,
      body.message,
      { type: 'promotion', promoCode: body.promoCode || '' },
    );
  }
}
