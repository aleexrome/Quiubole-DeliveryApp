import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true },
      relations: ['restaurant', 'category'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['restaurant', 'category'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async findByRestaurant(restaurantId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { restaurantId, isActive: true, isAvailable: true },
      relations: ['category'],
      order: { sortOrder: 'ASC' },
    });
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { categoryId, isActive: true, isAvailable: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productsRepository.create(productData);
    return this.productsRepository.save(product);
  }

  async update(id: string, productData: Partial<Product>): Promise<Product> {
    await this.productsRepository.update(id, productData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.productsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  async toggleAvailability(id: string, isAvailable: boolean): Promise<Product> {
    await this.productsRepository.update(id, { isAvailable });
    return this.findOne(id);
  }

  async search(query: string): Promise<Product[]> {
    return this.productsRepository
      .createQueryBuilder('product')
      .where('product.is_active = :isActive', { isActive: true })
      .andWhere('(product.name ILIKE :query OR product.description ILIKE :query)', {
        query: `%${query}%`,
      })
      .leftJoinAndSelect('product.restaurant', 'restaurant')
      .getMany();
  }
}
