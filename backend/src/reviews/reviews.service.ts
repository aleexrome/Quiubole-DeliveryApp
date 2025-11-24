import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { Order } from '../orders/order.entity';
import { Restaurant } from '../restaurants/restaurant.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
  ) {}

  async createReview(userId: string, data: any) {
    const order = await this.ordersRepository.findOne({
      where: { id: data.orderId, customerId: userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check if already reviewed
    const existingReview = await this.reviewsRepository.findOne({
      where: { orderId: data.orderId, userId },
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this order');
    }

    const review = this.reviewsRepository.create({
      userId,
      restaurantId: order.restaurantId,
      orderId: data.orderId,
      driverId: order.driverId,
      rating: data.rating,
      foodRating: data.foodRating,
      deliveryRating: data.deliveryRating,
      comment: data.comment,
      images: data.images,
    });

    const savedReview = await this.reviewsRepository.save(review);

    // Update restaurant average rating
    await this.updateRestaurantRating(order.restaurantId);

    return savedReview;
  }

  async getRestaurantReviews(restaurantId: string, page: number = 1, limit: number = 10) {
    const [reviews, total] = await this.reviewsRepository.findAndCount({
      where: { restaurantId, isPublic: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: reviews.map((r) => ({
        ...r,
        user: r.user ? { firstName: r.user.firstName, lastName: r.user.lastName?.charAt(0) } : null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserReviews(userId: string) {
    return this.reviewsRepository.find({
      where: { userId },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateReview(userId: string, reviewId: string, data: any) {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    Object.assign(review, {
      rating: data.rating ?? review.rating,
      foodRating: data.foodRating ?? review.foodRating,
      deliveryRating: data.deliveryRating ?? review.deliveryRating,
      comment: data.comment ?? review.comment,
      images: data.images ?? review.images,
    });

    const updatedReview = await this.reviewsRepository.save(review);

    // Update restaurant average rating
    await this.updateRestaurantRating(review.restaurantId);

    return updatedReview;
  }

  async deleteReview(userId: string, reviewId: string) {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const restaurantId = review.restaurantId;
    await this.reviewsRepository.remove(review);

    // Update restaurant average rating
    await this.updateRestaurantRating(restaurantId);

    return { success: true };
  }

  async addOwnerReply(ownerId: string, reviewId: string, reply: string) {
    const review = await this.reviewsRepository.findOne({
      where: { id: reviewId },
      relations: ['restaurant'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: review.restaurantId, ownerId },
    });

    if (!restaurant) {
      throw new ForbiddenException('Not authorized to reply to this review');
    }

    review.ownerReply = reply;
    review.ownerReplyAt = new Date();

    return this.reviewsRepository.save(review);
  }

  private async updateRestaurantRating(restaurantId: string) {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(*)', 'reviewCount')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    await this.restaurantsRepository.update(restaurantId, {
      rating: parseFloat(result.avgRating) || 0,
      reviewCount: parseInt(result.reviewCount) || 0,
    });
  }

  async getReviewStats(restaurantId: string) {
    const stats = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .groupBy('review.rating')
      .getRawMany();

    const total = stats.reduce((sum, s) => sum + parseInt(s.count), 0);
    const average =
      stats.reduce((sum, s) => sum + s.rating * parseInt(s.count), 0) / total || 0;

    return {
      average: Math.round(average * 10) / 10,
      total,
      distribution: {
        5: parseInt(stats.find((s) => s.rating === 5)?.count || '0'),
        4: parseInt(stats.find((s) => s.rating === 4)?.count || '0'),
        3: parseInt(stats.find((s) => s.rating === 3)?.count || '0'),
        2: parseInt(stats.find((s) => s.rating === 2)?.count || '0'),
        1: parseInt(stats.find((s) => s.rating === 1)?.count || '0'),
      },
    };
  }
}
