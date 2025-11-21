import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async add(userId: string, restaurantId: string): Promise<Favorite> {
    const existing = await this.favoritesRepository.findOne({
      where: { userId, restaurantId },
    });

    if (existing) {
      throw new ConflictException('Restaurant already in favorites');
    }

    const favorite = this.favoritesRepository.create({ userId, restaurantId });
    return this.favoritesRepository.save(favorite);
  }

  async findByUser(userId: string): Promise<Favorite[]> {
    return this.favoritesRepository.find({
      where: { userId },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async remove(userId: string, restaurantId: string): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, restaurantId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoritesRepository.remove(favorite);
  }

  async isFavorite(userId: string, restaurantId: string): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, restaurantId },
    });
    return !!favorite;
  }
}
