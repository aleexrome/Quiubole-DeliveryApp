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
    // Boundary del día (hoy 00:00:00) en hora del servidor.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      // ==== Conteos globales ====
      totalOrders,
      totalUsers,
      totalRestaurants,
      totalDrivers,
      totalEditors,
      totalCustomers,
      totalProducts,

      // ==== Hoy ====
      ordersToday,
      revenueTodayRaw,

      // ==== Ingreso histórico (solo orders entregadas) ====
      totalRevenueRaw,

      // ==== Activos / aprobados ====
      activeUsers,
      activeDrivers,
      activeRestaurants,

      // ==== Pendientes (esperando aprobación de admin) ====
      pendingRestaurants,
      pendingDrivers,
      pendingEditors,
      pendingProducts,
      pendingOrders,
      deliveredOrders,
    ] = await Promise.all([
      // Globales
      this.ordersRepository.count(),
      this.usersRepository.count(),
      this.restaurantsRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.DRIVER } }),
      this.usersRepository.count({ where: { role: UserRole.EDITOR } }),
      this.usersRepository.count({ where: { role: UserRole.CLIENT } }),
      this.productsRepository.count(),

      // Hoy: pedidos creados hoy + suma del total facturado hoy
      this.ordersRepository
        .createQueryBuilder('order')
        .where('order.createdAt >= :today', { today })
        .getCount(),
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.total), 0)', 'sum')
        .where('order.createdAt >= :today', { today })
        .andWhere('order.status = :delivered', { delivered: OrderStatus.DELIVERED })
        .getRawOne<{ sum: string }>(),

      // Histórico delivered
      this.ordersRepository
        .createQueryBuilder('order')
        .select('COALESCE(SUM(order.total), 0)', 'sum')
        .where('order.status = :delivered', { delivered: OrderStatus.DELIVERED })
        .getRawOne<{ sum: string }>(),

      // Active: users con isActive=true (= conteo de la app activa); drivers
      // disponibles; restaurants aprobados.
      this.usersRepository.count({ where: { isActive: true } }),
      this.usersRepository.count({
        where: { role: UserRole.DRIVER, isAvailable: true },
      }),
      this.restaurantsRepository.count({ where: { isApproved: true } }),

      // Pendientes de aprobación
      this.restaurantsRepository.count({ where: { isApproved: false } }),
      this.usersRepository.count({
        where: { role: UserRole.DRIVER, isApproved: false },
      }),
      this.usersRepository.count({
        where: { role: UserRole.EDITOR, isApproved: false },
      }),
      this.productsRepository.count({ where: { isApproved: false } }),
      this.ordersRepository.count({ where: { status: OrderStatus.PENDING } }),
      this.ordersRepository.count({ where: { status: OrderStatus.DELIVERED } }),
    ]);

    return {
      // Schema que consume el frontend (DashboardScreen).
      totalOrders,
      ordersToday,
      totalRevenue: parseFloat(totalRevenueRaw?.sum || '0'),
      revenueToday: parseFloat(revenueTodayRaw?.sum || '0'),
      activeUsers,
      activeDrivers,
      activeRestaurants,
      pendingRestaurants,
      pendingDrivers,
      pendingEditors,
      pendingProducts,

      // Campos legacy (mantengo por compatibilidad si otros lugares los leen).
      totalUsers,
      totalRestaurants,
      totalDrivers,
      totalEditors,
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
    };
  }

  async getUsers(
    page: number = 1,
    limit: number = 100,
    role?: string,
    search?: string,
  ) {
    // NestJS @Query() entrega los parámetros como strings, no como
    // numbers (incluso con el default tipado). TypeORM 0.3 hace strict
    // check y rechaza skip/take string → coerción explícita aquí.
    page = Number(page) || 1;
    limit = Number(limit) || 100;

    // En TypeORM QueryBuilder NO se ponen comillas manuales alrededor
    // de columnas. Sintaxis correcta: `alias.propertyName` y TypeORM
    // genera el SQL escapado automáticamente.
    const qb = this.usersRepository.createQueryBuilder('user');

    if (role && role !== 'all') {
      const normalized = role === 'customer' ? 'client' : role;
      qb.andWhere('user.role = :role', { role: normalized });
    }

    if (search && search.trim()) {
      qb.andWhere(
        '(LOWER(user.email) LIKE :s OR LOWER(user.firstName) LIKE :s OR LOWER(user.lastName) LIKE :s)',
        { s: `%${search.trim().toLowerCase()}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      data: users.map(({ password, ...user }) => user),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Devuelve conteos por rol para los pills de la pantalla Admin → Users.
   * Una sola query agrupada — más eficiente que N counts separados.
   */
  async getUserStats() {
    const rows = await this.usersRepository
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role')
      .getRawMany<{ role: string; count: string }>();

    const byRole = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.role] = parseInt(r.count, 10);
      return acc;
    }, {});

    const total = Object.values(byRole).reduce((a, b) => a + b, 0);

    return {
      all: total,
      // Alias: el frontend usa 'customer' pero el enum es 'client'.
      customer: byRole.client || 0,
      client: byRole.client || 0,
      restaurant: byRole.restaurant || 0,
      driver: byRole.driver || 0,
      editor: byRole.editor || 0,
      admin: byRole.admin || 0,
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

  /**
   * Aprobar un usuario que estaba pendiente. Setea isApproved=true.
   * Útil para drivers/restaurants/editors que requieren revisión.
   */
  async approveUser(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isApproved = true;
    user.rejectionReason = null;
    user.isActive = true;
    return this.usersRepository.save(user);
  }

  /**
   * Rechazar un usuario. Setea isApproved=false, isActive=false y guarda
   * la razón. El user puede seguir logueándose pero será dirigido a
   * la pantalla "Cuenta no aprobada".
   */
  async rejectUser(id: string, reason?: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    user.isApproved = false;
    user.isActive = false;
    user.rejectionReason = reason || 'No cumple requisitos';
    return this.usersRepository.save(user);
  }

  /**
   * Aprobar producto: lo hace visible en endpoints públicos.
   */
  async approveProduct(id: string) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.isApproved = true;
    return this.productsRepository.save(product);
  }

  async rejectProduct(id: string, _reason?: string) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    product.isApproved = false;
    product.isActive = false;
    return this.productsRepository.save(product);
  }

  /**
   * Listado de productos con filtro pending/approved/all.
   */
  async getProducts(
    page: number = 1,
    limit: number = 100,
    status?: 'pending' | 'approved' | 'all',
  ) {
    page = Number(page) || 1;
    limit = Number(limit) || 100;

    const qb = this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.restaurant', 'restaurant');

    if (status === 'pending') qb.andWhere('product.isApproved = false');
    else if (status === 'approved') qb.andWhere('product.isApproved = true');

    qb.orderBy('product.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [products, total] = await qb.getManyAndCount();
    return {
      data: products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Conteos para los pills/KPIs de la pantalla Admin → Productos.
   */
  async getProductsStats() {
    const all = await this.productsRepository.count();
    const approved = await this.productsRepository.count({
      where: { isApproved: true },
    });
    return { all, approved, pending: all - approved };
  }

  async deleteUser(id: string) {
    // Si es editor, limpia primero la junction table restaurant_editors.
    // Sin esto el FK de restaurant_editors.editor_id bloquea el delete
    // (o genera filas huérfanas dependiendo del driver).
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['editedRestaurants'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role === UserRole.EDITOR && user.editedRestaurants?.length) {
      user.editedRestaurants = [];
      await this.usersRepository.save(user);
    }

    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
    return { message: 'User deleted successfully' };
  }

  async getRestaurants(
    page: number = 1,
    limit: number = 100,
    status?: 'pending' | 'approved' | 'all',
  ) {
    page = Number(page) || 1;
    limit = Number(limit) || 100;

    const qb = this.restaurantsRepository.createQueryBuilder('restaurant');

    if (status === 'pending') qb.andWhere('restaurant.isApproved = false');
    else if (status === 'approved') qb.andWhere('restaurant.isApproved = true');

    qb.orderBy('restaurant.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [restaurants, total] = await qb.getManyAndCount();

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

  async getOrders(page: number = 1, limit: number = 100, status?: string) {
    page = Number(page) || 1;
    limit = Number(limit) || 100;

    const qb = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.driver', 'driver')
      .leftJoinAndSelect('order.restaurant', 'restaurant');

    if (status && status !== 'all' && status !== 'active') {
      qb.andWhere('order.status = :status', { status });
    } else if (status === 'active') {
      qb.andWhere('order.status NOT IN (:...finals)', {
        finals: ['delivered', 'cancelled'],
      });
    }

    qb.orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [orders, total] = await qb.getManyAndCount();

    return {
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDrivers(
    page: number = 1,
    limit: number = 100,
    status?: 'all' | 'active' | 'inactive' | 'pending',
  ) {
    page = Number(page) || 1;
    limit = Number(limit) || 100;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.DRIVER });

    if (status === 'active')
      qb.andWhere('user.isAvailable = true AND user.isApproved = true');
    else if (status === 'inactive')
      qb.andWhere('user.isAvailable = false AND user.isApproved = true');
    else if (status === 'pending') qb.andWhere('user.isApproved = false');

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [drivers, total] = await qb.getManyAndCount();

    return {
      data: drivers.map(({ password, ...driver }) => driver),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Conteos por estado para los pills/KPIs de la pantalla Admin → Pedidos.
   * Una sola query con GROUP BY status.
   */
  async getOrdersStats() {
    const rows = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany<{ status: string; count: string }>();

    const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = parseInt(r.count, 10);
      return acc;
    }, {});

    // "Activos" = todos los no-finales (no delivered, no cancelled).
    const FINALS = new Set(['delivered', 'cancelled']);
    const active = Object.entries(byStatus)
      .filter(([s]) => !FINALS.has(s))
      .reduce((sum, [, n]) => sum + n, 0);

    const all = Object.values(byStatus).reduce((a, b) => a + b, 0);

    return {
      all,
      active,
      pending: byStatus.pending || 0,
      confirmed: byStatus.confirmed || 0,
      preparing: byStatus.preparing || 0,
      ready_for_pickup: byStatus.ready_for_pickup || 0,
      driver_assigned: byStatus.driver_assigned || 0,
      picked_up: byStatus.picked_up || 0,
      on_the_way: byStatus.on_the_way || 0,
      delivered: byStatus.delivered || 0,
      cancelled: byStatus.cancelled || 0,
    };
  }

  /**
   * Conteos para los pills/KPIs de la pantalla Admin → Negocios.
   */
  async getRestaurantsStats() {
    const all = await this.restaurantsRepository.count();
    const approved = await this.restaurantsRepository.count({
      where: { isApproved: true },
    });
    const pending = all - approved;
    return { all, approved, pending };
  }

  /**
   * Conteos para los pills/KPIs de la pantalla Admin → Drivers.
   */
  async getDriversStats() {
    const all = await this.usersRepository.count({
      where: { role: UserRole.DRIVER },
    });
    const active = await this.usersRepository.count({
      where: { role: UserRole.DRIVER, isAvailable: true, isApproved: true },
    });
    const pending = await this.usersRepository.count({
      where: { role: UserRole.DRIVER, isApproved: false },
    });
    const approved = all - pending;
    const inactive = approved - active;

    return { all, active, inactive, pending };
  }
}
