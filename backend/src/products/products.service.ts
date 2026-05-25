import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { OrderItem } from '../orders/order-item.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

// Órdenes que NO cuentan como "activas" — ya terminaron su ciclo y sus
// order_items son solo histórico. Cualquier otro estado bloquea el borrado.
const TERMINAL_ORDER_STATUSES = [
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
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

  /**
   * Lista productos del restaurante.
   * - Por defecto (public/cliente): solo aprobados, disponibles y activos.
   * - `includePending`: incluye en-revisión y no-disponibles. Para editor/
   *   admin que necesita ver toda su carta para gestionarla.
   */
  async findByRestaurant(
    restaurantId: string,
    options: { includePending?: boolean } = {},
  ): Promise<Product[]> {
    const where: any = {
      restaurantId,
      isActive: true,
    };
    if (!options.includePending) {
      where.isApproved = true;
      where.isAvailable = true;
    }
    return this.productsRepository.find({
      where,
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

  /**
   * Elimina un producto de forma segura:
   * - Si está vinculado a órdenes activas (no delivered/cancelled) → 409.
   * - Si solo tiene historial de órdenes terminadas → soft delete
   *   (isActive=false) para preservar order_items históricos.
   * - Si nunca fue ordenado → hard delete.
   */
  async remove(id: string): Promise<{ softDeleted: boolean }> {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // ¿Hay order_items en órdenes aún activas?
    const activeOrderItems = await this.orderItemsRepository
      .createQueryBuilder('oi')
      .innerJoin('oi.order', 'o')
      .where('oi.productId = :id', { id })
      .andWhere('o.status NOT IN (:...terminal)', {
        terminal: TERMINAL_ORDER_STATUSES,
      })
      .getCount();

    if (activeOrderItems > 0) {
      throw new ConflictException(
        'No puedes eliminar este producto: está en órdenes activas. ' +
          'Desactívalo (isAvailable=false) o espera a que las órdenes terminen.',
      );
    }

    // ¿Hay histórico? Si sí, soft-delete para no romper FKs.
    const historicalCount = await this.orderItemsRepository.count({
      where: { productId: id },
    });

    if (historicalCount > 0) {
      await this.productsRepository.update(id, {
        isActive: false,
        isAvailable: false,
      });
      return { softDeleted: true };
    }

    await this.productsRepository.delete(id);
    return { softDeleted: false };
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
