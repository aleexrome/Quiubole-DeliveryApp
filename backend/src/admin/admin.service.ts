import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Order } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
  ) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalDrivers,
      pendingOrders,
      deliveredOrders,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.restaurantsRepository.count(),
      this.ordersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.DRIVER } }),
      this.ordersRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.ordersRepository.count({ where: { status: OrderStatus.DELIVERED } }),
    ]);

    return {
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalDrivers,
      pendingOrders,
      deliveredOrders,
    };
  }

  async getUsers(page: number = 1, limit: number = 10) {
    const [users, total] = await this.usersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users.map(({ password, ...user }) => user),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateUser(id: string, data: Partial<User>) {
    await this.usersRepository.update(id, data);
    return this.getUserById(id);
  }

  async deleteUser(id: string) {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  async getRestaurants(page: number = 1, limit: number = 10) {
    const [restaurants, total] = await this.restaurantsRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: restaurants,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveRestaurant(id: string) {
    const restaurant = await this.restaurantsRepository.findOne({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    restaurant.isApproved = true;
    return this.restaurantsRepository.save(restaurant);
  }

  async getOrders(page: number = 1, limit: number = 10) {
    const [orders, total] = await this.ordersRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['customer', 'driver', 'restaurant'],
    });

    return {
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDrivers(page: number = 1, limit: number = 10) {
    const [drivers, total] = await this.usersRepository.findAndCount({
      where: { role: UserRole.DRIVER },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: drivers.map(({ password, ...driver }) => driver),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
