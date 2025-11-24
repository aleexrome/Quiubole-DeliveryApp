import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../orders/order.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async getRevenueStats(startDate?: Date, endDate?: Date) {
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.status = :status', { status: OrderStatus.DELIVERED });

    if (startDate && endDate) {
      query.andWhere('order.deliveredAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const orders = await query.getMany();

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalDeliveryFees = orders.reduce((sum, order) => sum + Number(order.deliveryFee), 0);
    const totalServiceFees = orders.reduce((sum, order) => sum + Number(order.serviceFee), 0);
    const totalTips = orders.reduce((sum, order) => sum + Number(order.tip), 0);

    return {
      totalOrders: orders.length,
      totalRevenue,
      totalDeliveryFees,
      totalServiceFees,
      totalTips,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
    };
  }

  async getDailyRevenue(days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.ordersRepository.find({
      where: {
        status: OrderStatus.DELIVERED,
        deliveredAt: Between(startDate, endDate),
      },
    });

    const dailyRevenue: { [key: string]: number } = {};

    orders.forEach((order) => {
      const date = order.deliveredAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + Number(order.total);
    });

    return Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }
}
