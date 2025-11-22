// ==========================================
// REVIEWS SERVICE - SERVICIO DE CALIFICACIONES
// ==========================================

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './reviews.entity';

interface CreateReviewDto {
  orderId: string;
  customerId: string;
  restaurantId?: string;
  driverId?: string;
  restaurantRating?: number;
  driverRating?: number;
  overallRating: number;
  comment?: string;
  tags?: string[];
  photos?: string[];
  wouldRecommend?: boolean;
}

interface UpdateReviewDto {
  restaurantRating?: number;
  driverRating?: number;
  overallRating?: number;
  comment?: string;
  tags?: string[];
  photos?: string[];
  wouldRecommend?: boolean;
}

interface RestaurantResponseDto {
  response: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingBreakdown: { [key: number]: number };
  recentReviews: Review[];
}

// Tags predefinidos para reviews
export const REVIEW_TAGS = {
  positive: [
    'Comida deliciosa',
    'Buen precio',
    'Rapido',
    'Buena presentacion',
    'Porciones generosas',
    'Excelente servicio',
    'Muy amable',
    'Entrega puntual',
    'Buena comunicacion',
  ],
  negative: [
    'Tardo mucho',
    'Comida fria',
    'Mal empacado',
    'Pedido incorrecto',
    'Porciones pequenas',
    'Precio alto',
    'Mala actitud',
    'Sin seguimiento',
  ],
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  /**
   * Crear una nueva review
   */
  async create(dto: CreateReviewDto): Promise<Review> {
    // Verificar que no exista ya una review para este pedido
    const existingReview = await this.reviewsRepository.findOne({
      where: { orderId: dto.orderId, customerId: dto.customerId },
    });

    if (existingReview) {
      throw new BadRequestException('Ya has calificado este pedido');
    }

    // Validar ratings
    if (dto.restaurantRating && (dto.restaurantRating < 1 || dto.restaurantRating > 5)) {
      throw new BadRequestException('La calificacion debe ser entre 1 y 5');
    }
    if (dto.driverRating && (dto.driverRating < 1 || dto.driverRating > 5)) {
      throw new BadRequestException('La calificacion debe ser entre 1 y 5');
    }
    if (dto.overallRating < 1 || dto.overallRating > 5) {
      throw new BadRequestException('La calificacion debe ser entre 1 y 5');
    }

    // Determinar tipo de review
    let type: 'restaurant' | 'driver' | 'both' = 'both';
    if (dto.restaurantRating && !dto.driverRating) {
      type = 'restaurant';
    } else if (!dto.restaurantRating && dto.driverRating) {
      type = 'driver';
    }

    const review = this.reviewsRepository.create({
      ...dto,
      type,
    });

    const savedReview = await this.reviewsRepository.save(review);

    // Actualizar promedios del restaurante y repartidor
    if (dto.restaurantId && dto.restaurantRating) {
      await this.updateRestaurantRating(dto.restaurantId);
    }
    if (dto.driverId && dto.driverRating) {
      await this.updateDriverRating(dto.driverId);
    }

    return savedReview;
  }

  /**
   * Obtener review por ID
   */
  async findById(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review no encontrada');
    }
    return review;
  }

  /**
   * Obtener review de un pedido
   */
  async findByOrderId(orderId: string): Promise<Review | null> {
    return this.reviewsRepository.findOne({ where: { orderId } });
  }

  /**
   * Obtener reviews de un restaurante
   */
  async findByRestaurantId(
    restaurantId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ reviews: Review[]; total: number; pages: number }> {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { restaurantId, isVisible: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener reviews de un repartidor
   */
  async findByDriverId(
    driverId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ reviews: Review[]; total: number; pages: number }> {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { driverId, isVisible: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      reviews,
      total,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener reviews de un cliente
   */
  async findByCustomerId(customerId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Actualizar una review (solo dentro de 24 horas)
   */
  async update(id: string, customerId: string, dto: UpdateReviewDto): Promise<Review> {
    const review = await this.findById(id);

    if (review.customerId !== customerId) {
      throw new BadRequestException('No puedes editar esta review');
    }

    // Verificar que no hayan pasado mas de 24 horas
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new BadRequestException('Solo puedes editar tu review dentro de las primeras 24 horas');
    }

    Object.assign(review, dto);
    const updatedReview = await this.reviewsRepository.save(review);

    // Actualizar promedios
    if (review.restaurantId) {
      await this.updateRestaurantRating(review.restaurantId);
    }
    if (review.driverId) {
      await this.updateDriverRating(review.driverId);
    }

    return updatedReview;
  }

  /**
   * Agregar respuesta del restaurante
   */
  async addRestaurantResponse(
    reviewId: string,
    restaurantId: string,
    dto: RestaurantResponseDto,
  ): Promise<Review> {
    const review = await this.findById(reviewId);

    if (review.restaurantId !== restaurantId) {
      throw new BadRequestException('No puedes responder a esta review');
    }

    if (review.restaurantResponse) {
      throw new BadRequestException('Ya has respondido a esta review');
    }

    review.restaurantResponse = dto.response;
    review.restaurantResponseAt = new Date();

    return this.reviewsRepository.save(review);
  }

  /**
   * Reportar una review
   */
  async report(reviewId: string, reason: string): Promise<Review> {
    const review = await this.findById(reviewId);
    review.isReported = true;
    review.reportReason = reason;
    return this.reviewsRepository.save(review);
  }

  /**
   * Obtener estadisticas de reviews de un restaurante
   */
  async getRestaurantStats(restaurantId: string): Promise<ReviewStats> {
    const reviews = await this.reviewsRepository.find({
      where: { restaurantId, isVisible: true },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentReviews: [],
      };
    }

    // Calcular promedio
    const sum = reviews.reduce((acc, r) => acc + (r.restaurantRating || r.overallRating), 0);
    const averageRating = sum / totalReviews;

    // Breakdown por estrellas
    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rating = Math.round(r.restaurantRating || r.overallRating);
      ratingBreakdown[rating as keyof typeof ratingBreakdown]++;
    });

    // Reviews recientes
    const recentReviews = reviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingBreakdown,
      recentReviews,
    };
  }

  /**
   * Obtener estadisticas de reviews de un repartidor
   */
  async getDriverStats(driverId: string): Promise<ReviewStats> {
    const reviews = await this.reviewsRepository.find({
      where: { driverId, isVisible: true },
    });

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentReviews: [],
      };
    }

    const sum = reviews.reduce((acc, r) => acc + (r.driverRating || r.overallRating), 0);
    const averageRating = sum / totalReviews;

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const rating = Math.round(r.driverRating || r.overallRating);
      ratingBreakdown[rating as keyof typeof ratingBreakdown]++;
    });

    const recentReviews = reviews
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingBreakdown,
      recentReviews,
    };
  }

  /**
   * Actualizar rating promedio del restaurante
   */
  private async updateRestaurantRating(restaurantId: string): Promise<void> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.restaurantRating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .andWhere('review.isVisible = true')
      .andWhere('review.restaurantRating IS NOT NULL')
      .getRawOne();

    // TODO: Actualizar el restaurante con el nuevo rating
    console.log(`Restaurant ${restaurantId} new rating: ${result.avg} (${result.count} reviews)`);
  }

  /**
   * Actualizar rating promedio del repartidor
   */
  private async updateDriverRating(driverId: string): Promise<void> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.driverRating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('review.driverId = :driverId', { driverId })
      .andWhere('review.isVisible = true')
      .andWhere('review.driverRating IS NOT NULL')
      .getRawOne();

    // TODO: Actualizar el driver con el nuevo rating
    console.log(`Driver ${driverId} new rating: ${result.avg} (${result.count} reviews)`);
  }

  /**
   * Obtener tags disponibles
   */
  getAvailableTags(): typeof REVIEW_TAGS {
    return REVIEW_TAGS;
  }
}
