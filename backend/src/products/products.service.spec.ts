import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { OrderItem } from '../orders/order-item.entity';

describe('ProductsService.remove()', () => {
  let service: ProductsService;
  let productsRepo: any;
  let orderItemsRepo: any;
  let qb: any;

  beforeEach(async () => {
    qb = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    };
    productsRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    orderItemsRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      count: jest.fn().mockResolvedValue(0),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: productsRepo },
        { provide: getRepositoryToken(OrderItem), useValue: orderItemsRepo },
      ],
    }).compile();
    service = module.get(ProductsService);
  });

  it('404 si el producto no existe', async () => {
    productsRepo.findOne.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });

  it('409 si hay órdenes activas que referencian el producto', async () => {
    productsRepo.findOne.mockResolvedValue({ id: 'p1', isActive: true });
    qb.getCount.mockResolvedValue(3); // 3 order_items en órdenes activas
    await expect(service.remove('p1')).rejects.toThrow(ConflictException);
    expect(productsRepo.delete).not.toHaveBeenCalled();
    expect(productsRepo.update).not.toHaveBeenCalled();
  });

  it('soft-delete cuando solo hay histórico (delivered/cancelled)', async () => {
    productsRepo.findOne.mockResolvedValue({ id: 'p1', isActive: true });
    qb.getCount.mockResolvedValue(0); // nada activo
    orderItemsRepo.count.mockResolvedValue(5); // 5 histórico

    const result = await service.remove('p1');
    expect(result).toEqual({ softDeleted: true });
    expect(productsRepo.update).toHaveBeenCalledWith('p1', {
      isActive: false,
      isAvailable: false,
    });
    expect(productsRepo.delete).not.toHaveBeenCalled();
  });

  it('hard-delete cuando nunca fue ordenado', async () => {
    productsRepo.findOne.mockResolvedValue({ id: 'p1', isActive: true });
    qb.getCount.mockResolvedValue(0);
    orderItemsRepo.count.mockResolvedValue(0);

    const result = await service.remove('p1');
    expect(result).toEqual({ softDeleted: false });
    expect(productsRepo.delete).toHaveBeenCalledWith('p1');
    expect(productsRepo.update).not.toHaveBeenCalled();
  });
});
