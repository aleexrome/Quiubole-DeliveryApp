import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { SearchRestaurantDto } from './dto/search-restaurant.dto';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
  ) {}

  async create(createRestaurantDto: CreateRestaurantDto, ownerId: string): Promise<Restaurant> {
    const restaurant = this.restaurantsRepository.create({
      ...createRestaurantDto,
      ownerId,
    });
    return this.restaurantsRepository.save(restaurant);
  }

  async findAll(): Promise<Restaurant[]> {
    return this.restaurantsRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return restaurant;
  }

  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    return this.restaurantsRepository.find({ where: { ownerId } });
  }

  async update(id: string, updateRestaurantDto: UpdateRestaurantDto): Promise<Restaurant> {
    const restaurant = await this.findOne(id);
    Object.assign(restaurant, updateRestaurantDto);
    return this.restaurantsRepository.save(restaurant);
  }

  async remove(id: string): Promise<void> {
    const restaurant = await this.findOne(id);
    await this.restaurantsRepository.remove(restaurant);
  }

  async search(searchDto: SearchRestaurantDto): Promise<Restaurant[]> {
    const query = this.restaurantsRepository.createQueryBuilder('restaurant');
    query.where('restaurant.isActive = :isActive', { isActive: true });

    if (searchDto.search) {
      query.andWhere(
        '(LOWER(restaurant.name) LIKE LOWER(:search) OR LOWER(restaurant.description) LIKE LOWER(:search))',
        { search: `%${searchDto.search}%` },
      );
    }

    if (searchDto.tags) {
      const tagsArray = searchDto.tags.split(',');
      query.andWhere('restaurant.tags && :tags', { tags: tagsArray });
    }

    if (searchDto.minRating) {
      query.andWhere('restaurant.rating >= :minRating', { minRating: searchDto.minRating });
    }

    if (searchDto.maxDeliveryFee) {
      query.andWhere('restaurant.deliveryFee <= :maxDeliveryFee', { maxDeliveryFee: searchDto.maxDeliveryFee });
    }

    if (searchDto.latitude && searchDto.longitude && searchDto.radius) {
      query.andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(restaurant.latitude)) * cos(radians(restaurant.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(restaurant.latitude)))) <= :radius`,
        { lat: searchDto.latitude, lng: searchDto.longitude, radius: searchDto.radius },
      );
    }

    if (searchDto.sortBy) {
      switch (searchDto.sortBy) {
        case 'rating':
          query.orderBy('restaurant.rating', 'DESC');
          break;
        case 'deliveryFee':
          query.orderBy('restaurant.deliveryFee', 'ASC');
          break;
        case 'name':
          query.orderBy('restaurant.name', 'ASC');
          break;
        default:
          query.orderBy('restaurant.rating', 'DESC');
      }
    } else {
      query.orderBy('restaurant.rating', 'DESC');
    }

    return query.getMany();
  }

  async updateRating(id: string, newRating: number, totalReviews: number): Promise<void> {
    await this.restaurantsRepository.update(id, { rating: newRating, totalReviews });
  }
}
