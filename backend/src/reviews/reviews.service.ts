import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewType } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    private restaurantsService: RestaurantsService,
  ) {}

  async create(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
    const review = this.reviewsRepository.create({
      ...createReviewDto,
      userId,
    });
    const savedReview = await this.reviewsRepository.save(review);

    if (createReviewDto.type === ReviewType.RESTAURANT && createReviewDto.restaurantId) {
      await this.updateRestaurantRating(createReviewDto.restaurantId);
    }

    return savedReview;
  }

  async findAll(): Promise<Review[]> {
    return this.reviewsRepository.find({
      relations: ['user', 'restaurant', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { restaurantId, type: ReviewType.RESTAURANT },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByProduct(productId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { productId, type: ReviewType.PRODUCT },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { userId },
      relations: ['restaurant', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['user', 'restaurant', 'product'],
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async remove(id: string): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewsRepository.remove(review);

    if (review.type === ReviewType.RESTAURANT && review.restaurantId) {
      await this.updateRestaurantRating(review.restaurantId);
    }
  }

  private async updateRestaurantRating(restaurantId: string): Promise<void> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avgRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .andWhere('review.type = :type', { type: ReviewType.RESTAURANT })
      .getRawOne();

    const avgRating = parseFloat(result.avgRating) || 0;
    const totalReviews = parseInt(result.totalReviews) || 0;

    await this.restaurantsService.updateRating(restaurantId, Math.round(avgRating * 10) / 10, totalReviews);
  }
}
