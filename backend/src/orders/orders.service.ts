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
import { OrderStatus } from '../common/enums/order-status.enum';
import { v4 as uuidv4 } from 'uuid';

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
  ) {}

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
    const total = subtotal + deliveryFee + serviceFee + tax;

    const orderNumber = `QUI-${Date.now().toString(36).toUpperCase()}`;

    const order = this.ordersRepository.create({
      orderNumber,
      customerId,
      restaurantId: data.restaurantId,
      status: OrderStatus.PENDING,
      subtotal,
      deliveryFee,
      serviceFee,
      tax,
      total,
      deliveryAddress: data.deliveryAddress,
      deliveryLatitude: data.deliveryLatitude,
      deliveryLongitude: data.deliveryLongitude,
      deliveryInstructions: data.deliveryInstructions,
      paymentMethod: data.paymentMethod,
      couponCode: data.couponCode,
      items: orderItems,
    });

    const savedOrder = await this.ordersRepository.save(order);

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

    return this.ordersRepository.save(order);
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

    return this.ordersRepository.save(order);
  }

  async markReady(id: string): Promise<Order> {
    const order = await this.getOrderById(id);

    order.status = OrderStatus.READY_FOR_PICKUP;
    order.readyAt = new Date();

    return this.ordersRepository.save(order);
  }

  async getAvailableOrdersForDriver(driverId: string) {
    return this.ordersRepository.find({
      where: { status: OrderStatus.READY_FOR_PICKUP, driverId: null as any },
      relations: ['restaurant', 'customer'],
      order: { createdAt: 'ASC' },
    });
  }

  async pickupOrder(id: string, driverId: string): Promise<Order> {
    const order = await this.getOrderById(id);

    if (order.status !== OrderStatus.READY_FOR_PICKUP) {
      throw new BadRequestException('Order is not ready for pickup');
    }

    order.driverId = driverId;
    order.status = OrderStatus.PICKED_UP;
    order.pickedUpAt = new Date();

    return this.ordersRepository.save(order);
  }

  async deliverOrder(id: string): Promise<Order> {
    const order = await this.getOrderById(id);

    order.status = OrderStatus.DELIVERED;
    order.deliveredAt = new Date();
    order.actualDeliveryTime = new Date();

    return this.ordersRepository.save(order);
  }
}
