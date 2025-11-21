import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { RestaurantsService } from '../restaurants/restaurants.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private restaurantsService: RestaurantsService,
  ) {}

  async create(createOrderDto: CreateOrderDto, customerId: string): Promise<Order> {
    const restaurant = await this.restaurantsService.findOne(createOrderDto.restaurantId);

    const items = createOrderDto.items.map((item) => {
      const extrasTotal = item.extras?.reduce((sum, extra) => sum + Number(extra.price), 0) || 0;
      const subtotal = (Number(item.unitPrice) + extrasTotal) * item.quantity;
      return { ...item, subtotal };
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal), 0);
    const deliveryFee = Number(restaurant.deliveryFee) || 0;
    const total = subtotal + deliveryFee;

    const orderNumber = `QUI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const order = this.ordersRepository.create({
      ...createOrderDto,
      customerId,
      orderNumber,
      items,
      subtotal,
      deliveryFee,
      total,
      discount: 0,
    });

    return this.ordersRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      relations: ['customer', 'restaurant', 'driver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: ['customer', 'restaurant', 'driver'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findByCustomer(customerId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { customerId },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { restaurantId },
      relations: ['customer', 'driver'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByDriver(driverId: string): Promise<Order[]> {
    return this.ordersRepository.find({
      where: { driverId },
      relations: ['customer', 'restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPendingOrders(): Promise<Order[]> {
    return this.ordersRepository.find({
      where: [
        { status: OrderStatus.READY },
        { status: OrderStatus.CONFIRMED },
      ],
      relations: ['customer', 'restaurant'],
      order: { createdAt: 'ASC' },
    });
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.findOne(id);
    Object.assign(order, updateOrderDto);
    return this.ordersRepository.save(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;

    if (status === OrderStatus.DELIVERED) {
      order.actualDeliveryTime = new Date();
    }

    return this.ordersRepository.save(order);
  }

  async assignDriver(orderId: string, driverId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    order.driverId = driverId;
    order.status = OrderStatus.PICKED_UP;
    return this.ordersRepository.save(order);
  }

  async cancel(id: string): Promise<Order> {
    const order = await this.findOne(id);
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestException('Order cannot be cancelled at this stage');
    }
    order.status = OrderStatus.CANCELLED;
    return this.ordersRepository.save(order);
  }
}
