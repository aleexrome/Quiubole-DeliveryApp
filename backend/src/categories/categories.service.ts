import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepo: Repository<Category>,
  ) {}

  /** Categorías globales (sin restaurantId) — las que define el admin. */
  async findAllGlobal(): Promise<Category[]> {
    return this.categoriesRepo.find({
      where: { isActive: true, restaurantId: null as any },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /** Categorías propias de un restaurante (submenús). */
  async findByRestaurant(restaurantId: string): Promise<Category[]> {
    return this.categoriesRepo.find({
      where: { restaurantId, isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const cat = await this.categoriesRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException(`Category ${id} not found`);
    return cat;
  }

  async create(data: Partial<Category>): Promise<Category> {
    const cat = this.categoriesRepo.create(data);
    return this.categoriesRepo.save(cat);
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    await this.categoriesRepo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.categoriesRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Category ${id} not found`);
    }
  }
}
