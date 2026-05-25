import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Order } from '../orders/order.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { NotificationsService } from '../notifications/notifications.service';

// Umbrales de proximidad (en metros).
const NEAR_THRESHOLD_M = 500;
const ARRIVED_THRESHOLD_M = 50;

/**
 * Distancia entre dos coords en metros (fórmula Haversine). Suficientemente
 * precisa para zonas urbanas (< 5km). Para distancias grandes mejor usar
 * Vincenty, pero el caso de uso aquí es delivery local.
 */
function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // radio Tierra en metros
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private notifications: NotificationsService,
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

  async updateLocation(
    id: string,
    latitude: number,
    longitude: number,
  ): Promise<User> {
    const driver = await this.findOne(id);
    driver.currentLatitude = latitude;
    driver.currentLongitude = longitude;
    const saved = await this.usersRepository.save(driver);

    // Geo-fencing: si tiene orden en tránsito (picked_up), calcular
    // distancia al destino y disparar push de proximidad al cliente.
    // Idempotente: cada notif (near/arrived) se dispara solo una vez
    // por orden gracias a los timestamps en order.customer*NotifiedAt.
    await this.checkProximityNotifications(id, latitude, longitude);

    return saved;
  }

  private async checkProximityNotifications(
    driverId: string,
    lat: number,
    lng: number,
  ): Promise<void> {
    try {
      const activeOrder = await this.ordersRepository.findOne({
        where: { driverId, status: OrderStatus.PICKED_UP },
      });
      if (!activeOrder?.deliveryLatitude || !activeOrder?.deliveryLongitude) {
        return;
      }

      const distance = haversineMeters(
        lat,
        lng,
        Number(activeOrder.deliveryLatitude),
        Number(activeOrder.deliveryLongitude),
      );

      // ARRIVED — se dispara siempre que llegue, aunque ya hubo "near".
      if (
        distance <= ARRIVED_THRESHOLD_M &&
        !activeOrder.customerArrivedNotifiedAt
      ) {
        activeOrder.customerArrivedNotifiedAt = new Date();
        await this.ordersRepository.save(activeOrder);
        if (activeOrder.customerId) {
          await this.notifications.sendPushNotification(
            activeOrder.customerId,
            '📍 Tu repartidor llegó',
            `${activeOrder.orderNumber} está afuera. Sal a recoger tu pedido.`,
            {
              type: 'order_arrived',
              orderId: activeOrder.id,
              status: activeOrder.status,
            },
          );
        }
        return;
      }

      // NEAR — solo si aún no se notificó cerca Y no es ya "arrived".
      if (
        distance <= NEAR_THRESHOLD_M &&
        !activeOrder.customerNearNotifiedAt &&
        !activeOrder.customerArrivedNotifiedAt
      ) {
        activeOrder.customerNearNotifiedAt = new Date();
        await this.ordersRepository.save(activeOrder);
        if (activeOrder.customerId) {
          await this.notifications.sendPushNotification(
            activeOrder.customerId,
            '🛵 Tu repartidor está cerca',
            `Está a menos de 500m de tu dirección. Prepárate.`,
            {
              type: 'order_near',
              orderId: activeOrder.id,
              status: activeOrder.status,
              distanceMeters: Math.round(distance),
            },
          );
        }
      }
    } catch {
      /* silent — un fallo en proximidad nunca debe romper la actualización */
    }
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<User> {
    const driver = await this.findOne(id);
    driver.isAvailable = isAvailable;
    return this.usersRepository.save(driver);
  }

  /**
   * Actualiza info del vehículo del driver. Esta info se muestra al
   * cliente cuando se asigna driver al pedido (seguridad: placas, modelo).
   */
  async updateVehicle(
    id: string,
    data: {
      vehicleType?: string;
      vehiclePlate?: string;
      vehicleModel?: string;
      vehicleColor?: string;
    },
  ): Promise<User> {
    const driver = await this.findOne(id);
    if (data.vehicleType !== undefined)
      (driver as any).vehicleType = data.vehicleType;
    if (data.vehiclePlate !== undefined)
      (driver as any).vehiclePlate = data.vehiclePlate;
    if (data.vehicleModel !== undefined)
      (driver as any).vehicleModel = data.vehicleModel;
    if (data.vehicleColor !== undefined)
      (driver as any).vehicleColor = data.vehicleColor;
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
