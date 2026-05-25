import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { Restaurant } from '../restaurants/restaurant.entity';
import { User } from '../users/user.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { DevoCouponsService } from '../devo-coupons/devo-coupons.service';
import { v4 as uuidv4 } from 'uuid';
import { Optional } from '@nestjs/common';

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
    private notifications: NotificationsService,
    // Optional para evitar circular dependency si el módulo no está cargado
    // en algún contexto de test. En prod siempre estará presente.
    @Optional() private devoCoupons?: DevoCouponsService,
  ) {}

  // ============================================
  // PUSH NOTIFICATIONS — helpers privados
  // ============================================

  /** Notifica al cliente del pedido. Silencioso si no tiene customer. */
  private async notifyCustomer(
    order: Order,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ) {
    if (!order.customerId) return;
    try {
      await this.notifications.sendPushNotification(order.customerId, title, body, {
        type: 'order_status',
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        ...data,
      });
    } catch {
      /* silent — la transición de status nunca debe fallar por push */
    }
  }

  /** Notifica al dueño del restaurant del pedido. */
  private async notifyRestaurantOwner(
    order: Order,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ) {
    if (!order.restaurantId) return;
    try {
      const restaurant = await this.restaurantsRepository.findOne({
        where: { id: order.restaurantId },
      });
      if (!restaurant?.ownerId) return;
      await this.notifications.sendPushNotification(
        restaurant.ownerId,
        title,
        body,
        { type: 'order_restaurant', orderId: order.id, ...data },
      );
    } catch {
      /* silent */
    }
  }

  /** Notifica al driver asignado a la orden. */
  private async notifyDriver(
    order: Order,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ) {
    if (!order.driverId) return;
    try {
      await this.notifications.sendPushNotification(order.driverId, title, body, {
        type: 'order_driver',
        orderId: order.id,
        ...data,
      });
    } catch {
      /* silent */
    }
  }

  /**
   * Broadcast a TODOS los drivers activos (isAvailable=true, isApproved=true).
   * Se usa cuando un pedido pasa a `ready_for_pickup` para alertar a todos
   * los que pueden tomar la entrega.
   */
  private async broadcastToAvailableDrivers(
    order: Order,
    title: string,
    body: string,
  ) {
    try {
      const drivers = await this.usersRepository.find({
        where: {
          role: UserRole.DRIVER,
          isAvailable: true,
          isApproved: true,
          isActive: true,
        },
      });
      await Promise.all(
        drivers.map((d) =>
          this.notifications.sendPushNotification(d.id, title, body, {
            type: 'order_available',
            orderId: order.id,
            restaurantId: order.restaurantId,
          }),
        ),
      );
    } catch {
      /* silent */
    }
  }

  async createOrder(customerId: string, data: any): Promise<Order> {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { id: data.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // Calculate totals
    let subtotal = 0;
    const orderItems: Partial<OrderItem>[] = [];

    for (const item of data.items) {
      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal,
        modifiers: item.options,
      });
    }

    const deliveryFee = Number(restaurant.deliveryFee) || 0;
    const serviceFee = subtotal * 0.05; // 5% service fee
    const tax = subtotal * 0.16; // 16% IVA

    // ============ APLICAR DEVO CUPÓN ============
    // Si el cliente eligió un cupón Devo en checkout, validamos y
    // calculamos el descuento. El cupón se marca como redimido DESPUÉS
    // de que la orden se guarde (atomic-ish — si falla el save no
    // perdemos el cupón).
    let discount = 0;
    let deliveryFeeFinal = deliveryFee;
    if (data.devoCouponId && this.devoCoupons) {
      const productIds = orderItems
        .map((i) => i.productId)
        .filter(Boolean) as string[];
      const preview = await this.devoCoupons.previewDiscount(
        data.devoCouponId,
        customerId,
        subtotal,
        deliveryFee,
        data.restaurantId,
        productIds,
      );
      discount = preview.discount;
      deliveryFeeFinal = Math.max(0, deliveryFee - preview.deliveryDiscount);
    }

    const total =
      subtotal + deliveryFeeFinal + serviceFee + tax - discount;

    const orderNumber = `QUI-${Date.now().toString(36).toUpperCase()}`;

    const order = this.ordersRepository.create({
      orderNumber,
      customerId,
      restaurantId: data.restaurantId,
      status: OrderStatus.PENDING,
      subtotal,
      deliveryFee: deliveryFeeFinal,
      serviceFee,
      tax,
      discount,
      total,
      deliveryAddress: data.deliveryAddress,
      deliveryLatitude: data.deliveryLatitude,
      deliveryLongitude: data.deliveryLongitude,
      deliveryInstructions: data.deliveryInstructions,
      customerNotes: data.customerNotes,
      paymentMethod: data.paymentMethod,
      tip: Number(data.tip) || 0,
      couponCode: data.couponCode,
      items: orderItems,
    });

    const savedOrder = await this.ordersRepository.save(order);

    // Marcar el UserCoupon como redimido (atado a esta orden).
    if (data.devoCouponId && this.devoCoupons) {
      try {
        await this.devoCoupons.redeem(
          data.devoCouponId,
          customerId,
          savedOrder.id,
          discount + (deliveryFee - deliveryFeeFinal),
        );
      } catch (e) {
        console.error('Error redeeming devo coupon:', e);
      }
    }

    return this.getOrderById(savedOrder.id, customerId);
  }

  async getOrderById(id: string, userId?: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'driver', 'restaurant'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    const [orders, total] = await this.ordersRepository.findAndCount({
      where: { customerId: userId },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async cancelOrder(id: string, userId: string): Promise<Order> {
    const order = await this.getOrderById(id, userId);

    if (order.customerId !== userId) {
      throw new ForbiddenException('Not authorized to cancel this order');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();

    const saved = await this.ordersRepository.save(order);

    // Si la orden usó un DevoCoupon, devolverlo a estado activo.
    if (this.devoCoupons) {
      try {
        await this.devoCoupons.refund(id);
      } catch (e) {
        console.error('Error refunding devo coupon:', e);
      }
    }

    return saved;
  }

  async getRestaurantOrders(ownerId: string, status?: string) {
    const restaurant = await this.restaurantsRepository.findOne({
      where: { ownerId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const query: any = { restaurantId: restaurant.id };
    if (status) {
      query.status = status;
    }

    return this.ordersRepository.find({
      where: query,
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async acceptOrder(id: string): Promise<Order> {
    const order = await this.getOrderById(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not pending');
    }

    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();
    const saved = await this.ordersRepository.save(order);

    await this.notifyCustomer(
      saved,
      '¡Tu pedido fue aceptado!',
      `El restaurante confirmó tu pedido #${saved.orderNumber}.`,
    );

    // Broadcast a todos los drivers disponibles — pueden hacer claim early
    // y empezar a acercarse al restaurante mientras la cocina prepara.
    await this.broadcastToAvailableDrivers(
      saved,
      '📦 Nuevo pedido disponible',
      `${saved.orderNumber} confirmado — toma la entrega ahora.`,
    );

    return saved;
  }

  /** Restaurant indica que ya empezó a preparar el pedido. */
  async markPreparing(id: string): Promise<Order> {
    const order = await this.getOrderById(id);
    if (
      order.status !== OrderStatus.CONFIRMED &&
      order.status !== OrderStatus.PENDING
    ) {
      throw new BadRequestException(
        'El pedido no puede pasar a preparando desde este estado',
      );
    }
    order.status = OrderStatus.PREPARING;
    order.preparingAt = new Date();
    const saved = await this.ordersRepository.save(order);

    await this.notifyCustomer(
      saved,
      'Tu pedido está en preparación',
      `${saved.orderNumber} ya está siendo preparado.`,
    );
    return saved;
  }

  async markReady(id: string): Promise<Order> {
    const order = await this.getOrderById(id);

    order.readyAt = new Date();
    // Si ya hay driver claim early, promovemos directo a DRIVER_ASSIGNED
    // y le mandamos push solo a él. Si nadie ha tomado el pedido, queda
    // en READY_FOR_PICKUP y hacemos broadcast a todos los disponibles.
    if (order.driverId) {
      order.status = OrderStatus.DRIVER_ASSIGNED;
    } else {
      order.status = OrderStatus.READY_FOR_PICKUP;
    }
    const saved = await this.ordersRepository.save(order);

    // Notifica al cliente que su pedido va a salir pronto
    await this.notifyCustomer(
      saved,
      'Tu pedido está listo',
      `${saved.orderNumber} pronto saldrá del restaurante.`,
    );

    if (saved.driverId) {
      // Driver ya hizo claim — solo notificar a él que la comida está lista.
      await this.notifyDriver(
        saved,
        '🍽️ Tu pedido está listo',
        `Recoge ${saved.orderNumber} en el restaurante.`,
      );
    } else {
      // Nadie ha tomado el pedido — broadcast a todos los disponibles.
      await this.broadcastToAvailableDrivers(
        saved,
        '🍽️ Nueva entrega disponible',
        `Pedido ${saved.orderNumber} listo para recoger.`,
      );
    }

    return saved;
  }

  /** Rechazar pedido del restaurant — pasa a cancelled con razón. */
  async rejectOrder(id: string, reason?: string): Promise<Order> {
    const order = await this.getOrderById(id);
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Solo se pueden rechazar pedidos pendientes o confirmados',
      );
    }
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Rechazado por el restaurante';
    const saved = await this.ordersRepository.save(order);

    await this.notifyCustomer(
      saved,
      'Tu pedido fue rechazado',
      saved.cancellationReason || 'El restaurante no pudo procesarlo.',
    );
    return saved;
  }

  /**
   * Driver acepta el pedido y se auto-asigna como repartidor.
   *
   * Si el pedido aún está CONFIRMED o PREPARING, solo reservamos al
   * driver con `driverId` pero NO cambiamos el status — la cocina sigue
   * trabajando normal. Cuando el restaurant pase a READY, markReady
   * detecta que ya hay driverId y promueve a DRIVER_ASSIGNED notificando
   * solo a ese rider.
   *
   * Si el pedido ya estaba READY_FOR_PICKUP, sí cambiamos a
   * DRIVER_ASSIGNED inmediatamente (el rider llega y recoge).
   */
  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    const order = await this.getOrderById(orderId);
    if (order.driverId && order.driverId !== driverId) {
      throw new BadRequestException('Este pedido ya tiene repartidor asignado');
    }
    const claimableStatuses = [
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
    ];
    if (!claimableStatuses.includes(order.status)) {
      throw new BadRequestException(
        'El pedido aún no está disponible para tomar',
      );
    }
    order.driverId = driverId;
    // Solo promovemos status si la comida ya estaba lista.
    if (order.status === OrderStatus.READY_FOR_PICKUP) {
      order.status = OrderStatus.DRIVER_ASSIGNED;
    }
    const saved = await this.ordersRepository.save(order);

    // Notifica al cliente con info del driver (incluyendo vehicle).
    const driver = await this.usersRepository.findOne({
      where: { id: driverId },
    });
    const driverName =
      [driver?.firstName, driver?.lastName].filter(Boolean).join(' ') ||
      'tu repartidor';
    const vehiclePart = (driver as any)?.vehiclePlate
      ? ` · ${(driver as any).vehiclePlate}`
      : '';
    await this.notifyCustomer(
      saved,
      'Repartidor asignado',
      `${driverName} llevará tu pedido${vehiclePart}.`,
    );

    // Notifica al restaurant que ya hay quien recoja.
    await this.notifyRestaurantOwner(
      saved,
      'Repartidor en camino al local',
      `${driverName} viene por ${saved.orderNumber}.`,
    );

    return saved;
  }

  async getAvailableOrdersForDriver(driverId: string) {
    // Mostramos pedidos desde que el restaurante CONFIRMA, no esperamos
    // a READY_FOR_PICKUP. Así el rider claim early y se va acercando al
    // local mientras la cocina prepara — la comida no se enfría.
    // Filtramos por driverId IS NULL para no mostrar pedidos ya tomados.
    return this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.restaurant', 'restaurant')
      .leftJoinAndSelect('order.customer', 'customer')
      .where('order.status IN (:...statuses)', {
        statuses: [
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY_FOR_PICKUP,
        ],
      })
      .andWhere('order.driverId IS NULL')
      .orderBy('order.confirmedAt', 'ASC')
      .getMany();
  }

  async pickupOrder(id: string, driverId: string): Promise<Order> {
    const order = await this.getOrderById(id);

    if (
      order.status !== OrderStatus.READY_FOR_PICKUP &&
      order.status !== OrderStatus.DRIVER_ASSIGNED
    ) {
      throw new BadRequestException('Order is not ready for pickup');
    }

    order.driverId = driverId;
    order.status = OrderStatus.PICKED_UP;
    order.pickedUpAt = new Date();
    const saved = await this.ordersRepository.save(order);

    await this.notifyCustomer(
      saved,
      'Tu pedido va en camino',
      `El repartidor ya tiene tu pedido y va para tu dirección.`,
    );
    return saved;
  }

  async deliverOrder(id: string): Promise<Order> {
    const order = await this.getOrderById(id);

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    order.actualDeliveryTime = new Date();
    const saved = await this.ordersRepository.save(order);

    await this.notifyCustomer(
      saved,
      '¡Pedido entregado!',
      `${saved.orderNumber} fue entregado. ¡Buen provecho!`,
    );
    await this.notifyRestaurantOwner(
      saved,
      'Pedido entregado',
      `${saved.orderNumber} llegó a su destino.`,
    );

    // ============ DEVO POINTS ============
    // Al entregar el pedido, sumar 10 puntos al cliente. Si cruza un
    // múltiplo de 100, el service crea un UserCoupon pending_admin y
    // dispara push al admin para que asigne el cupón.
    if (saved.customerId && this.devoCoupons) {
      try {
        await this.devoCoupons.awardPointsForOrder(
          saved.customerId,
          saved.id,
        );
      } catch (e) {
        // No bloquea el delivery si el sistema de puntos falla.
        console.error('Error awarding devo points:', e);
      }
    }

    return saved;
  }
}
