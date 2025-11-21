// ==========================================
// REVIEWS CONTROLLER - ENDPOINTS DE CALIFICACIONES
// ==========================================

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService, REVIEW_TAGS } from './reviews.service';

// TODO: Importar guards reales
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * Crear una nueva review
   * POST /reviews
   */
  @Post()
  // @UseGuards(JwtAuthGuard)
  async create(@Request() req: any, @Body() body: any) {
    const customerId = req.user?.id || body.customerId;
    return this.reviewsService.create({
      ...body,
      customerId,
    });
  }

  /**
   * Obtener review por ID
   * GET /reviews/:id
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.reviewsService.findById(id);
  }

  /**
   * Obtener review de un pedido
   * GET /reviews/order/:orderId
   */
  @Get('order/:orderId')
  async findByOrderId(@Param('orderId') orderId: string) {
    return this.reviewsService.findByOrderId(orderId);
  }

  /**
   * Obtener reviews de un restaurante
   * GET /reviews/restaurant/:restaurantId
   */
  @Get('restaurant/:restaurantId')
  async findByRestaurantId(
    @Param('restaurantId') restaurantId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewsService.findByRestaurantId(restaurantId, page, limit);
  }

  /**
   * Obtener estadisticas de un restaurante
   * GET /reviews/restaurant/:restaurantId/stats
   */
  @Get('restaurant/:restaurantId/stats')
  async getRestaurantStats(@Param('restaurantId') restaurantId: string) {
    return this.reviewsService.getRestaurantStats(restaurantId);
  }

  /**
   * Obtener reviews de un repartidor
   * GET /reviews/driver/:driverId
   */
  @Get('driver/:driverId')
  async findByDriverId(
    @Param('driverId') driverId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.reviewsService.findByDriverId(driverId, page, limit);
  }

  /**
   * Obtener estadisticas de un repartidor
   * GET /reviews/driver/:driverId/stats
   */
  @Get('driver/:driverId/stats')
  async getDriverStats(@Param('driverId') driverId: string) {
    return this.reviewsService.getDriverStats(driverId);
  }

  /**
   * Obtener mis reviews
   * GET /reviews/me
   */
  @Get('me')
  // @UseGuards(JwtAuthGuard)
  async findMyReviews(@Request() req: any) {
    const customerId = req.user?.id || req.query.customerId;
    return this.reviewsService.findByCustomerId(customerId);
  }

  /**
   * Actualizar una review
   * PUT /reviews/:id
   */
  @Put(':id')
  // @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const customerId = req.user?.id || body.customerId;
    return this.reviewsService.update(id, customerId, body);
  }

  /**
   * Agregar respuesta del restaurante
   * POST /reviews/:id/response
   */
  @Post(':id/response')
  // @UseGuards(JwtAuthGuard)
  async addRestaurantResponse(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    const restaurantId = req.user?.restaurantId || body.restaurantId;
    return this.reviewsService.addRestaurantResponse(id, restaurantId, body);
  }

  /**
   * Reportar una review
   * POST /reviews/:id/report
   */
  @Post(':id/report')
  async report(@Param('id') id: string, @Body('reason') reason: string) {
    return this.reviewsService.report(id, reason);
  }

  /**
   * Obtener tags disponibles
   * GET /reviews/tags
   */
  @Get('config/tags')
  getTags() {
    return REVIEW_TAGS;
  }
}
