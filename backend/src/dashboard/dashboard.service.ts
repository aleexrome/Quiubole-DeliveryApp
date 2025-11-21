import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from '../orders/order.entity';
import { User, UserRole } from '../users/user.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { Review } from '../reviews/review.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
  ) {}

  async getAdminStats() {
    const totalOrders = await this.ordersRepository.count();
    const totalRevenue = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    const totalUsers = await this.usersRepository.count();
    const totalRestaurants = await this.restaurantsRepository.count();
    const totalDrivers = await this.usersRepository.count({ where: { role: UserRole.DRIVER } });

    const ordersToday = await this.getOrdersCountForPeriod(1);
    const ordersThisWeek = await this.getOrdersCountForPeriod(7);
    const ordersThisMonth = await this.getOrdersCountForPeriod(30);

    const ordersByStatus = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return {
      totalOrders,
      totalRevenue: totalRevenue?.total || 0,
      totalUsers,
      totalRestaurants,
      totalDrivers,
      ordersToday,
      ordersThisWeek,
      ordersThisMonth,
      ordersByStatus,
    };
  }

  async getRestaurantStats(restaurantId: string) {
    const totalOrders = await this.ordersRepository.count({ where: { restaurantId } });
    const totalRevenue = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .andWhere('order.paymentStatus = :status', { status: PaymentStatus.PAID })
      .getRawOne();

    const avgRating = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'avg')
      .where('review.restaurantId = :restaurantId', { restaurantId })
      .getRawOne();

    const totalReviews = await this.reviewsRepository.count({ where: { restaurantId } });

    const ordersToday = await this.getRestaurantOrdersForPeriod(restaurantId, 1);
    const ordersThisWeek = await this.getRestaurantOrdersForPeriod(restaurantId, 7);

    const ordersByStatus = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .groupBy('order.status')
      .getRawMany();

    const topProducts = await this.ordersRepository
      .createQueryBuilder('order')
      .select("jsonb_array_elements(order.items::jsonb)->>'productName'", 'productName')
      .addSelect('COUNT(*)', 'count')
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .groupBy("jsonb_array_elements(order.items::jsonb)->>'productName'")
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalOrders,
      totalRevenue: totalRevenue?.total || 0,
      avgRating: avgRating?.avg || 0,
      totalReviews,
      ordersToday,
      ordersThisWeek,
      ordersByStatus,
      topProducts,
    };
  }

  async getDriverStats(driverId: string) {
    const totalDeliveries = await this.ordersRepository.count({
      where: { driverId, status: OrderStatus.DELIVERED },
    });

    const totalEarnings = await this.ordersRepository
      .createQueryBuilder('order')
      .select('SUM(order.deliveryFee)', 'total')
      .where('order.driverId = :driverId', { driverId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne();

    const deliveriesToday = await this.getDriverDeliveriesForPeriod(driverId, 1);
    const deliveriesThisWeek = await this.getDriverDeliveriesForPeriod(driverId, 7);

    return {
      totalDeliveries,
      totalEarnings: totalEarnings?.total || 0,
      deliveriesToday,
      deliveriesThisWeek,
    };
  }

  private async getOrdersCountForPeriod(days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.ordersRepository.count({
      where: { createdAt: Between(startDate, new Date()) },
    });
  }

  private async getRestaurantOrdersForPeriod(restaurantId: string, days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.ordersRepository.count({
      where: { restaurantId, createdAt: Between(startDate, new Date()) },
    });
  }

  private async getDriverDeliveriesForPeriod(driverId: string, days: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.ordersRepository.count({
      where: {
        driverId,
        status: OrderStatus.DELIVERED,
        createdAt: Between(startDate, new Date()),
      },
    });
  }
}
