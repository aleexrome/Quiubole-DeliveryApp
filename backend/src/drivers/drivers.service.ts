import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: UserRole.DRIVER },
    });
  }

  async findOne(id: string): Promise<User> {
    const driver = await this.usersRepository.findOne({
      where: { id, role: UserRole.DRIVER },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${id} not found`);
    }
    return driver;
  }

  async getAvailableDrivers(): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        role: UserRole.DRIVER,
        isActive: true,
      },
    });
  }

  async getDriverOrders(driverId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { driverId },
      order: { createdAt: 'DESC' },
    });
  }

  async getActiveOrders(driverId: string): Promise<Order[]> {
    return this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .andWhere('order.status NOT IN (:...statuses)', {
        statuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
      })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<User> {
    const driver = await this.findOne(id);
    // Update driver location
    driver.currentLatitude = latitude;
    driver.currentLongitude = longitude;
    return this.usersRepository.save(driver);
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<User> {
    const driver = await this.findOne(id);
    driver.isAvailable = isAvailable;
    return this.usersRepository.save(driver);
  }

  async getEarnings(driverId: string, startDate?: Date, endDate?: Date): Promise<any> {
    const query = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.driverId = :driverId', { driverId })
      .andWhere('order.status = :status', { status: OrderStatus.DELIVERED });

    if (startDate) {
      query.andWhere('order.deliveredAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('order.deliveredAt <= :endDate', { endDate });
    }

    const orders = await query.getMany();

    const totalEarnings = orders.reduce((sum, order) => {
      return sum + (Number(order.tip) || 0) + (Number(order.deliveryFee) * 0.8 || 0);
    }, 0);

    return {
      totalOrders: orders.length,
      totalEarnings,
      orders,
    };
  }
}
