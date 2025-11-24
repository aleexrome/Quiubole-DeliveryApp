import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class DriverBalanceService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getBalance(driverId: string) {
    const orders = await this.ordersRepository.find({
      where: {
        driverId,
        status: OrderStatus.DELIVERED,
      },
    });

    const totalEarnings = orders.reduce((sum, order) => {
      const deliveryEarning = Number(order.deliveryFee) * 0.8; // 80% of delivery fee
      const tipEarning = Number(order.tip) || 0;
      return sum + deliveryEarning + tipEarning;
    }, 0);

    return {
      totalEarnings,
      totalDeliveries: orders.length,
      pendingPayout: totalEarnings, // In a real app, subtract already paid amounts
    };
  }

  async getDriverStats(driverId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [todayOrders, weekOrders, monthOrders, totalOrders] = await Promise.all([
      this.ordersRepository.count({
        where: {
          driverId,
          status: OrderStatus.DELIVERED,
        },
      }),
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.driverId = :driverId', { driverId })
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('order.deliveredAt >= :weekStart', { weekStart: thisWeekStart })
        .getCount(),
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.driverId = :driverId', { driverId })
        .andWhere('order.status = :status', { status: OrderStatus.DELIVERED })
        .andWhere('order.deliveredAt >= :monthStart', { monthStart: thisMonthStart })
        .getCount(),
      this.ordersRepository.count({
        where: {
          driverId,
          status: OrderStatus.DELIVERED,
        },
      }),
    ]);

    const driver = await this.usersRepository.findOne({ where: { id: driverId } });

    return {
      todayDeliveries: todayOrders,
      weekDeliveries: weekOrders,
      monthDeliveries: monthOrders,
      totalDeliveries: totalOrders,
      rating: 5.0, // Would come from reviews in a real app
      isAvailable: driver?.isAvailable || false,
    };
  }
}
