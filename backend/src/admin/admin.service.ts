// ==========================================
// ADMIN SERVICE - Logica de Administracion
// ==========================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { Coupon } from '../coupons/coupon.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,
    private notificationsService: NotificationsService,
  ) {}

  // Dashboard stats
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      ordersToday,
      totalRevenue,
      revenueToday,
      activeUsers,
      activeDrivers,
      activeRestaurants,
      pendingRestaurants,
      pendingDrivers,
      pendingProducts,
    ] = await Promise.all([
      this.ordersRepository.count(),
      this.ordersRepository.count({
        where: { createdAt: today as any }, // Simplificado
      }),
      this.ordersRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .getRawOne(),
      this.ordersRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .where('order.createdAt >= :today', { today })
        .getRawOne(),
      this.usersRepository.count({ where: { role: 'customer' } }),
      this.usersRepository.count({ where: { role: 'driver' } }),
      this.restaurantsRepository.count({ where: { isApproved: true } }),
      this.restaurantsRepository.count({ where: { isApproved: false } }),
      this.usersRepository.count({
        where: { role: 'driver' /* isApproved: false */ },
      }),
      this.productsRepository.count({ where: { isApproved: false } }),
    ]);

    return {
      totalOrders,
      ordersToday,
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
      revenueToday: parseFloat(revenueToday?.total || '0'),
      activeUsers,
      activeDrivers,
      activeRestaurants,
      pendingRestaurants,
      pendingDrivers,
      pendingProducts,
    };
  }

  // ==========================================
  // USUARIOS
  // ==========================================

  async getUsers(params: { role?: string; search?: string; page: number }) {
    const { role, search, page } = params;
    const limit = 20;

    const query = this.usersRepository.createQueryBuilder('user');

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (search) {
      query.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy('user.createdAt', 'DESC');
    query.skip((page - 1) * limit);
    query.take(limit);

    return query.getMany();
  }

  async updateUser(id: string, data: any) {
    await this.usersRepository.update(id, data);
    return this.usersRepository.findOne({ where: { id } });
  }

  async banUser(id: string, reason: string) {
    // await this.usersRepository.update(id, { isBanned: true, banReason: reason });
    await this.notificationsService.sendToUser(
      id,
      'Cuenta Suspendida',
      reason,
      {},
    );
    return { success: true };
  }

  // ==========================================
  // RESTAURANTES
  // ==========================================

  async getPendingRestaurants() {
    return this.restaurantsRepository.find({
      where: { isApproved: false },
      relations: ['owner'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveRestaurant(id: string) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    restaurant.isApproved = true;
    await this.restaurantsRepository.save(restaurant);

    // Notificar al dueno
    await this.notificationsService.sendToUser(
      restaurant.ownerId,
      'Negocio Aprobado',
      `¡Felicidades! Tu negocio "${restaurant.name}" ha sido aprobado y ya esta activo.`,
      { restaurantId: id },
    );

    return restaurant;
  }

  async rejectRestaurant(id: string, reason: string) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    // Notificar al dueno
    await this.notificationsService.sendToUser(
      restaurant.ownerId,
      'Negocio No Aprobado',
      `Tu solicitud para "${restaurant.name}" no fue aprobada. Razon: ${reason}`,
      { restaurantId: id },
    );

    // Opcional: eliminar o marcar como rechazado
    await this.restaurantsRepository.delete(id);

    return { success: true };
  }

  // ==========================================
  // REPARTIDORES
  // ==========================================

  async getPendingDrivers() {
    return this.usersRepository.find({
      where: {
        role: 'driver',
        // isApproved: false,
      },
      order: { createdAt: 'ASC' },
    });
  }

  async approveDriver(id: string) {
    const driver = await this.usersRepository.findOne({
      where: { id, role: 'driver' },
    });

    if (!driver) {
      throw new NotFoundException('Repartidor no encontrado');
    }

    // driver.isApproved = true;
    await this.usersRepository.save(driver);

    await this.notificationsService.sendToUser(
      id,
      'Cuenta Aprobada',
      '¡Felicidades! Ya puedes empezar a hacer entregas con Quiubole.',
      {},
    );

    return driver;
  }

  async rejectDriver(id: string, reason: string) {
    await this.notificationsService.sendToUser(
      id,
      'Cuenta No Aprobada',
      `Tu solicitud como repartidor no fue aprobada. Razon: ${reason}`,
      {},
    );

    return { success: true };
  }

  // ==========================================
  // PRODUCTOS (Control de Calidad)
  // ==========================================

  async getPendingProducts() {
    return this.productsRepository.find({
      where: { isApproved: false },
      relations: ['restaurant'],
      order: { createdAt: 'ASC' },
    });
  }

  async approveProduct(id: string) {
    const product = await this.productsRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    product.isApproved = true;
    await this.productsRepository.save(product);

    // Notificar al restaurante
    await this.notificationsService.sendToRestaurant(
      product.restaurantId,
      'Producto Aprobado',
      `Tu producto "${product.name}" ya esta visible para los clientes.`,
      { productId: id },
    );

    return product;
  }

  async rejectProduct(id: string, reason: string) {
    const product = await this.productsRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    await this.notificationsService.sendToRestaurant(
      product.restaurantId,
      'Producto Rechazado',
      `Tu producto "${product.name}" no fue aprobado. Razon: ${reason}`,
      { productId: id },
    );

    await this.productsRepository.delete(id);

    return { success: true };
  }

  // Admin puede editar cualquier producto
  async updateProduct(id: string, data: any) {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Admin puede cambiar: precio, descripcion, imagen, nombre
    if (data.price !== undefined) product.price = data.price;
    if (data.description !== undefined) product.description = data.description;
    if (data.image !== undefined) product.image = data.image;
    if (data.name !== undefined) product.name = data.name;

    await this.productsRepository.save(product);

    return product;
  }

  // ==========================================
  // CUPONES
  // ==========================================

  async getCoupons() {
    return this.couponsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createCoupon(data: any) {
    const coupon = this.couponsRepository.create(data);
    return this.couponsRepository.save(coupon);
  }

  async updateCoupon(id: string, data: any) {
    await this.couponsRepository.update(id, data);
    return this.couponsRepository.findOne({ where: { id } });
  }

  async deleteCoupon(id: string) {
    await this.couponsRepository.delete(id);
    return { success: true };
  }
}
