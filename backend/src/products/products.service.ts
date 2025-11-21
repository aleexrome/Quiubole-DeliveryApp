import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create(createProductDto);
    return this.productsRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      where: { isActive: true, isAvailable: true },
      relations: ['category'],
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { restaurantId, isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: { categoryId, isActive: true, isAvailable: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['category', 'restaurant'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    Object.assign(product, updateProductDto);
    return this.productsRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepository.remove(product);
  }

  async search(query: string, restaurantId?: string): Promise<Product[]> {
    const qb = this.productsRepository.createQueryBuilder('product');
    qb.where('product.isActive = :isActive', { isActive: true });
    qb.andWhere('LOWER(product.name) LIKE LOWER(:query)', { query: `%${query}%` });

    if (restaurantId) {
      qb.andWhere('product.restaurantId = :restaurantId', { restaurantId });
    }

    return qb.getMany();
  }
}
