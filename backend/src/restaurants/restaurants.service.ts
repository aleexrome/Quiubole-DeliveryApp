import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
  ) {}

  async findAll(): Promise<Restaurant[]> {
    return this.restaurantsRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return restaurant;
  }

  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    return this.restaurantsRepository.find({ where: { ownerId } });
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Restaurant[]> {
    // Using Haversine formula for distance calculation
    const restaurants = await this.restaurantsRepository
      .createQueryBuilder('restaurant')
      .where('restaurant.is_active = :isActive', { isActive: true })
      .andWhere('restaurant.is_open = :isOpen', { isOpen: true })
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(restaurant.latitude)) * cos(radians(restaurant.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(restaurant.latitude)))) < :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .orderBy('restaurant.rating', 'DESC')
      .getMany();

    return restaurants;
  }

  async create(restaurantData: Partial<Restaurant>): Promise<Restaurant> {
    const restaurant = this.restaurantsRepository.create(restaurantData);
    return this.restaurantsRepository.save(restaurant);
  }

  async update(id: string, restaurantData: Partial<Restaurant>): Promise<Restaurant> {
    await this.restaurantsRepository.update(id, restaurantData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.restaurantsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
  }

  async toggleOpen(id: string, isOpen: boolean): Promise<Restaurant> {
    await this.restaurantsRepository.update(id, { isOpen });
    return this.findOne(id);
  }

  async updateRating(id: string, newRating: number, totalReviews: number): Promise<Restaurant> {
    await this.restaurantsRepository.update(id, {
      rating: newRating,
      totalReviews,
    });
    return this.findOne(id);
  }
}
