// ==========================================
// ORDERS SERVICE - Logica de Pedidos
// ==========================================

import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { User } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private notificationsService: NotificationsService,
  ) {}

  // Crear pedido
  async createOrder(customerId: string, data: any) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: data.restaurantId },
    });

    if (!restaurant || !restaurant.isActive) {
      throw new BadRequestException('Restaurante no disponible');
    }

    // Calcular totales
    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const item of data.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });

      if (!product || !product.isAvailable) {
        throw new BadRequestException(`Producto ${item.productId} no disponible`);
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        total: itemTotal,
        selectedOptions: item.options || [],
      } as OrderItem);
    }

    // Calcular fees
    const deliveryFee = restaurant.deliveryFee || 25;
    const serviceFee = subtotal * 0.05; // 5% comision
    const tip = data.tip || 0;
    const discount = 0; // TODO: aplicar cupon

    const total = subtotal + deliveryFee + serviceFee + tip - discount;

    // Generar numero de orden
    const orderNumber = `QUB-${Date.now().toString(36).toUpperCase()}`;

    // Crear orden
    const order = this.ordersRepository.create({
      orderNumber,
      customerId,
      restaurantId: data.restaurantId,
      status: 'pending',
      subtotal,
      deliveryFee,
      serviceFee,
      tip,
      discount,
      total,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentMethod === 'cash' ? 'pending' : 'paid',
      deliveryAddressId: data.deliveryAddressId,
      specialInstructions: data.specialInstructions,
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Guardar items
    for (const item of orderItems) {
      item.orderId = savedOrder.id;
      await this.orderItemsRepository.save(item);
    }

    // Notificar al restaurante
    await this.notificationsService.sendToRestaurant(
      data.restaurantId,
      'Nuevo Pedido',
      `Pedido #${orderNumber} recibido`,
      { orderId: savedOrder.id },
    );

    return this.getOrderById(savedOrder.id, { id: customerId });
  }

  // Obtener pedidos del cliente
  async getCustomerOrders(customerId: string) {
    return this.ordersRepository.find({
      where: { customerId },
      relations: ['restaurant', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  // Obtener pedido por ID
  async getOrderById(id: string, user: any) {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: [
        'restaurant',
        'customer',
        'driver',
        'items',
        'items.product',
        'deliveryAddress',
      ],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return order;
  }

  // Cancelar pedido
  async cancelOrder(orderId: string, customerId: string, reason: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, customerId },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (!['pending', 'confirmed'].includes(order.status)) {
      throw new BadRequestException('No se puede cancelar este pedido');
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    await this.ordersRepository.save(order);

    // Notificar al restaurante
    await this.notificationsService.sendToRestaurant(
      order.restaurantId,
      'Pedido Cancelado',
      `El pedido #${order.orderNumber} fue cancelado`,
      { orderId: order.id },
    );

    return order;
  }

  // Obtener pedidos del restaurante
  async getRestaurantOrders(restaurantId: string, status?: string) {
    const where: any = { restaurantId };
    if (status) {
      where.status = status;
    }

    return this.ordersRepository.find({
      where,
      relations: ['customer', 'items', 'items.product', 'driver'],
      order: { createdAt: 'DESC' },
    });
  }

  // Aceptar pedido (restaurante)
  async acceptOrder(orderId: string, estimatedTime: number) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order || order.status !== 'pending') {
      throw new BadRequestException('Pedido no disponible');
    }

    order.status = 'confirmed';
    order.confirmedAt = new Date();
    order.estimatedDeliveryTime = new Date(
      Date.now() + estimatedTime * 60 * 1000,
    );

    await this.ordersRepository.save(order);

    // Notificar al cliente
    await this.notificationsService.sendToUser(
      order.customerId,
      'Pedido Confirmado',
      `Tu pedido #${order.orderNumber} fue aceptado`,
      { orderId: order.id },
    );

    return order;
  }

  // Rechazar pedido (restaurante)
  async rejectOrder(orderId: string, reason: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order || order.status !== 'pending') {
      throw new BadRequestException('Pedido no disponible');
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    await this.ordersRepository.save(order);

    // Notificar al cliente y procesar reembolso si aplica
    await this.notificationsService.sendToUser(
      order.customerId,
      'Pedido Rechazado',
      `Lo sentimos, el restaurante no pudo aceptar tu pedido`,
      { orderId: order.id },
    );

    return order;
  }

  // Marcar como listo para recoger
  async markReadyForPickup(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
      relations: ['restaurant'],
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    order.status = 'ready_for_pickup';
    order.readyAt = new Date();

    await this.ordersRepository.save(order);

    // ASIGNACION DE REPARTIDORES (MODELO BROADCAST - TIPO UBER)
    // Notificar a todos los repartidores activos cercanos
    await this.notifyNearbyDrivers(order);

    return order;
  }

  // Notificar a repartidores cercanos (MODELO UBER)
  private async notifyNearbyDrivers(order: Order) {
    // Obtener repartidores activos en la zona
    const activeDrivers = await this.usersRepository.find({
      where: {
        role: 'driver',
        // status: 'online', // Si tienes campo de status
      },
    });

    // Filtrar por distancia (en produccion usar PostGIS o similar)
    const nearbyDrivers = activeDrivers; // TODO: filtrar por ubicacion

    // Enviar notificacion push a todos
    for (const driver of nearbyDrivers) {
      await this.notificationsService.sendToUser(
        driver.id,
        'Nuevo Pedido Disponible',
        `${order.restaurant.name} - $${order.deliveryFee + (order.tip || 0)} ganancia`,
        { orderId: order.id, type: 'new_delivery' },
      );
    }
  }

  // Obtener pedidos disponibles para repartidor
  async getAvailableOrdersForDriver(lat: number, lng: number, radiusKm: number) {
    // Obtener pedidos listos sin repartidor asignado
    const orders = await this.ordersRepository.find({
      where: {
        status: 'ready_for_pickup',
        driverId: null as any, // Sin repartidor asignado
      },
      relations: ['restaurant', 'customer', 'items'],
    });

    // TODO: Filtrar por distancia usando coordenadas
    // En produccion usar PostGIS: ST_DWithin

    return orders;
  }

  // Asignar repartidor (el primero que acepta se lo lleva)
  async assignDriver(orderId: string, driverId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order || order.status !== 'ready_for_pickup') {
      throw new BadRequestException('Pedido no disponible');
    }

    // Verificar que no tenga ya un repartidor
    if (order.driverId) {
      throw new BadRequestException('Este pedido ya fue tomado por otro repartidor');
    }

    // Asignar repartidor
    order.driverId = driverId;
    order.status = 'driver_assigned';

    await this.ordersRepository.save(order);

    // Notificar al restaurante y cliente
    await this.notificationsService.sendToRestaurant(
      order.restaurantId,
      'Repartidor Asignado',
      'Un repartidor va en camino a recoger el pedido',
      { orderId: order.id },
    );

    await this.notificationsService.sendToUser(
      order.customerId,
      'Repartidor en Camino',
      'Tu repartidor va hacia el restaurante',
      { orderId: order.id },
    );

    return this.getOrderById(orderId, { id: driverId });
  }

  // Actualizar estado del pedido
  async updateOrderStatus(orderId: string, status: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    order.status = status as any;

    // Timestamps segun estado
    if (status === 'preparing') order.preparingAt = new Date();
    if (status === 'picked_up') {
      order.pickedUpAt = new Date();
      order.status = 'on_the_way';

      // Notificar al cliente
      await this.notificationsService.sendToUser(
        order.customerId,
        'Pedido en Camino',
        'Tu repartidor recogió tu pedido y va hacia ti',
        { orderId: order.id },
      );
    }

    await this.ordersRepository.save(order);

    return order;
  }

  // Marcar como entregado
  async markDelivered(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.actualDeliveryTime = new Date();

    await this.ordersRepository.save(order);

    // Notificar al cliente
    await this.notificationsService.sendToUser(
      order.customerId,
      'Pedido Entregado',
      '¡Tu pedido ha sido entregado! Califica tu experiencia',
      { orderId: order.id },
    );

    // TODO: Acreditar ganancia al repartidor

    return order;
  }

  // Obtener entregas del repartidor
  async getDriverOrders(driverId: string) {
    return this.ordersRepository.find({
      where: { driverId },
      relations: ['restaurant', 'customer'],
      order: { createdAt: 'DESC' },
    });
  }

  // Obtener entrega activa del repartidor
  async getActiveDelivery(driverId: string) {
    return this.ordersRepository.findOne({
      where: {
        driverId,
        status: In(['driver_assigned', 'picked_up', 'on_the_way']),
      },
      relations: ['restaurant', 'customer', 'items', 'deliveryAddress'],
    });
  }

  // Obtener todos los pedidos (admin)
  async getAllOrders(params: {
    status?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }) {
    const { status, from, to, page, limit } = params;

    const query = this.ordersRepository.createQueryBuilder('order')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.driver', 'driver');

    if (status) {
      query.andWhere('order.status = :status', { status });
    }

    if (from) {
      query.andWhere('order.createdAt >= :from', { from });
    }

    if (to) {
      query.andWhere('order.createdAt <= :to', { to });
    }

    query.orderBy('order.createdAt', 'DESC');
    query.skip((page - 1) * limit);
    query.take(limit);

    return query.getMany();
  }
}
