// ==========================================
// AI CONTROLLER - Chatbot Endpoints
// ==========================================

import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// DTOs
class ChatMessageDto {
  message: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
}

@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  // ==========================================
  // CHATBOT
  // ==========================================

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chat(@Request() req, @Body() body: ChatMessageDto) {
    // Obtener preferencias del usuario (de la DB en producción)
    const userPreferences = {
      // location: req.user.lastLocation,
      // previousOrders: await this.ordersService.getUserOrderHistory(req.user.id),
      // favoriteCategories: req.user.favoriteCategories,
    };

    const result = await this.aiService.chat(
      body.message,
      body.conversationHistory || [],
      userPreferences,
    );

    return {
      response: result.response,
      recommendations: result.recommendations,
      timestamp: new Date(),
    };
  }

  // Chat sin autenticación (para usuarios no registrados)
  @Post('chat/guest')
  async chatGuest(@Body() body: ChatMessageDto) {
    const result = await this.aiService.chat(
      body.message,
      body.conversationHistory || [],
    );

    return {
      response: result.response,
      recommendations: result.recommendations,
      timestamp: new Date(),
    };
  }
}
