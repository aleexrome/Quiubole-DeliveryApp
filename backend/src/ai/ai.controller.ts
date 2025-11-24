import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  async getRecommendations(@Request() req, @Query('limit') limit?: number) {
    return this.aiService.getRecommendations(req.user.id, limit || 10);
  }

  @Get('search')
  @Public()
  async smartSearch(
    @Query('q') query: string,
    @Request() req,
  ) {
    const userId = req.user?.id;
    return this.aiService.smartSearch(query, userId);
  }

  @Get('delivery-estimate')
  @Public()
  async getDeliveryEstimate(
    @Query('restaurantId') restaurantId: string,
    @Query('distance') distance: string,
  ) {
    return this.aiService.predictDeliveryTime(
      restaurantId,
      parseFloat(distance),
    );
  }

  @Get('business-insights')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT, UserRole.ADMIN)
  async getBusinessInsights(@Query('restaurantId') restaurantId: string) {
    return this.aiService.getBusinessInsights(restaurantId);
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  async chatAssistant(@Request() req, @Body('message') message: string) {
    return this.aiService.chatAssistant(req.user.id, message);
  }
}
