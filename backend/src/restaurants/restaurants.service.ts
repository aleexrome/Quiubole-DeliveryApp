import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './restaurant.entity';
import { Order } from '../orders/order.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  /**
   * Devuelve el primer restaurante del owner autenticado. Aplica a roles
   * 'restaurant' / 'merchant' que usan el Dashboard del Restaurant.
   * Si el dueño aún no tiene negocio creado, devuelve null (el frontend
   * mostrará un estado "Crea tu negocio").
   */
  async findMyRestaurant(ownerId: string): Promise<Restaurant | null> {
    const restaurants = await this.findByOwner(ownerId);
    return restaurants[0] || null;
  }

  /**
   * Stats del restaurant del owner para el Dashboard. Devuelve totales
   * del período (hoy/semana/mes): pedidos, ingresos, rating promedio.
   * Si el owner no tiene restaurant aún, devuelve ceros.
   */
  async getStats(ownerId: string, period: 'day' | 'week' | 'month' = 'day') {
    const restaurant = await this.findMyRestaurant(ownerId);
    if (!restaurant) {
      return {
        orders: 0,
        revenue: 0,
        rating: 0,
        totalReviews: 0,
        period,
      };
    }

    // Boundary del período según el filtro.
    const since = new Date();
    if (period === 'day') since.setHours(0, 0, 0, 0);
    else if (period === 'week') since.setDate(since.getDate() - 7);
    else since.setDate(since.getDate() - 30);

    const ordersInPeriod = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.restaurantId = :rid', { rid: restaurant.id })
      .andWhere('order.createdAt >= :since', { since })
      .getCount();

    const revenueRaw = await this.ordersRepository
      .createQueryBuilder('order')
      .select('COALESCE(SUM(order.total), 0)', 'sum')
      .where('order.restaurantId = :rid', { rid: restaurant.id })
      .andWhere('order.status = :delivered', { delivered: OrderStatus.DELIVERED })
      .andWhere('order.createdAt >= :since', { since })
      .getRawOne<{ sum: string }>();

    return {
      orders: ordersInPeriod,
      revenue: parseFloat(revenueRaw?.sum || '0'),
      rating: Number(restaurant.rating) || 0,
      totalReviews: restaurant.totalReviews || 0,
      period,
    };
  }

  async findAll(): Promise<Restaurant[]> {
    return this.restaurantsRepository.find({
      where: { isActive: true },
      order: { rating: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Restaurant> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id },
      relations: ['owner'],
    });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return restaurant;
  }

  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    return this.restaurantsRepository.find({ where: { ownerId } });
  }

  /**
   * Abre/cierra el negocio del owner autenticado. Operación segura: solo
   * toca el campo `isOpen`, nada más. Si el dueño no tiene restaurant,
   * lanza NotFound — el frontend mostrará un estado vacío.
   */
  async setOpenForOwner(
    ownerId: string,
    isOpen: boolean,
  ): Promise<Restaurant> {
    const restaurant = await this.findMyRestaurant(ownerId);
    if (!restaurant) {
      throw new NotFoundException('No tienes un negocio asociado');
    }
    restaurant.isOpen = isOpen;
    return this.restaurantsRepository.save(restaurant);
  }

  async findNearby(latitude: number, longitude: number, radiusKm: number = 10): Promise<Restaurant[]> {
    // Using Haversine formula for distance calculation
    const restaurants = await this.restaurantsRepository
      .createQueryBuilder('restaurant')
      .where('restaurant.is_active = :isActive', { isActive: true })
      .andWhere('restaurant.is_open = :isOpen', { isOpen: true })
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(restaurant.latitude)) * cos(radians(restaurant.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(restaurant.latitude)))) < :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .orderBy('restaurant.rating', 'DESC')
      .getMany();

    return restaurants;
  }

  /**
   * Feed del cliente — "Cerca de ti".
   *
   * Filtra restaurantes donde:
   *   - distance(cliente.gps, restaurant.coords) ≤ restaurant.deliveryRadiusKm
   *
   * Es decir, "el cliente está dentro del radio de entrega que cada
   * restaurante define". Esto resuelve casos de borde entre municipios:
   * un negocio en Tenango puede atender clientes del norte de Tenancingo
   * si su radio lo cubre.
   *
   * Si `zone` se pasa pero el cliente NO tiene GPS, hacemos fallback a
   * solo filtrar por zona como label de marketing.
   *
   * Devuelve los restaurantes con un campo computado `distanceKm`
   * ordenado por distancia ascendente.
   */
  async findForCustomerFeed(opts: {
    latitude?: number;
    longitude?: number;
    zone?: string;
  }): Promise<Array<Restaurant & { distanceKm?: number }>> {
    const hasGps =
      typeof opts.latitude === 'number' && typeof opts.longitude === 'number';

    const qb = this.restaurantsRepository
      .createQueryBuilder('restaurant')
      .where('restaurant.is_active = :isActive', { isActive: true })
      .andWhere('restaurant.is_approved = :isApproved', { isApproved: true });

    if (hasGps) {
      // Distance (km) expression — Haversine inline (PostgreSQL).
      const distanceExpr = `(6371 * acos(LEAST(1, cos(radians(:lat)) * cos(radians(restaurant.latitude)) * cos(radians(restaurant.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(restaurant.latitude)))))`;
      qb.addSelect(distanceExpr, 'distance_km')
        .andWhere(`${distanceExpr} <= restaurant.delivery_radius_km`)
        .setParameters({ lat: opts.latitude, lng: opts.longitude })
        .orderBy('distance_km', 'ASC');
    } else if (opts.zone) {
      // Fallback sin GPS: filtrar por zona registrada del usuario.
      qb.andWhere('restaurant.zone = :zone', { zone: opts.zone }).orderBy(
        'restaurant.rating',
        'DESC',
      );
    } else {
      // Sin GPS ni zona — devuelve todo activo (no debería pasar).
      qb.orderBy('restaurant.rating', 'DESC');
    }

    if (hasGps) {
      const raw = await qb.getRawAndEntities();
      return raw.entities.map((r, i) => ({
        ...(r as any),
        distanceKm: parseFloat(raw.raw[i]?.distance_km),
      }));
    }
    return qb.getMany() as Promise<Array<Restaurant & { distanceKm?: number }>>;
  }

  async create(restaurantData: Partial<Restaurant>): Promise<Restaurant> {
    const restaurant = this.restaurantsRepository.create(restaurantData);
    return this.restaurantsRepository.save(restaurant);
  }

  async update(id: string, restaurantData: Partial<Restaurant>): Promise<Restaurant> {
    await this.restaurantsRepository.update(id, restaurantData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.restaurantsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
  }

  async toggleOpen(id: string, isOpen: boolean): Promise<Restaurant> {
    await this.restaurantsRepository.update(id, { isOpen });
    return this.findOne(id);
  }

  async updateRating(id: string, newRating: number, totalReviews: number): Promise<Restaurant> {
    await this.restaurantsRepository.update(id, {
      rating: newRating,
      totalReviews,
    });
    return this.findOne(id);
  }
}
