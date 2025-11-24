import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReview(@Request() req, @Body() body: any) {
    return this.reviewsService.createReview(req.user.id, body);
  }

  @Get('restaurant/:restaurantId')
  @Public()
  async getRestaurantReviews(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page: number = 1,
  ) {
    return this.reviewsService.getRestaurantReviews(restaurantId, page);
  }

  @Get('restaurant/:restaurantId/stats')
  @Public()
  async getReviewStats(@Param('restaurantId') restaurantId: string) {
    return this.reviewsService.getReviewStats(restaurantId);
  }

  @Get('my-reviews')
  @UseGuards(JwtAuthGuard)
  async getMyReviews(@Request() req) {
    return this.reviewsService.getUserReviews(req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async updateReview(
    @Request() req,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.reviewsService.updateReview(req.user.id, id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteReview(@Request() req, @Param('id') id: string) {
    return this.reviewsService.deleteReview(req.user.id, id);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RESTAURANT, UserRole.MERCHANT)
  async addOwnerReply(
    @Request() req,
    @Param('id') id: string,
    @Body('reply') reply: string,
  ) {
    return this.reviewsService.addOwnerReply(req.user.id, id, reply);
  }
}
