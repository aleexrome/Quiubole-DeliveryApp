import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { Restaurant } from '../restaurants/restaurant.entity';

@Injectable()
export class AiService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Restaurant)
    private restaurantsRepository: Repository<Restaurant>,
  ) {}

  // Get personalized recommendations for a user
  async getRecommendations(userId: string, limit: number = 10) {
    // Get user's order history
    const orderHistory = await this.ordersRepository.find({
      where: { customerId: userId },
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    // Get popular products
    const popularProducts = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
      .where('product.isAvailable = :available', { available: true })
      .groupBy('product.id')
      .orderBy('COUNT(oi.id)', 'DESC')
      .limit(limit)
      .getMany();

    // Get frequently ordered restaurants
    const frequentRestaurants = orderHistory.reduce((acc, order) => {
      if (order.restaurant) {
        acc[order.restaurantId] = (acc[order.restaurantId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      popularProducts,
      reorderSuggestions: orderHistory.slice(0, 5),
      frequentRestaurantIds: Object.keys(frequentRestaurants),
    };
  }

  // Search products with AI-powered relevance
  async smartSearch(query: string, userId?: string) {
    // Simple keyword search with relevance scoring
    const searchTerms = query.toLowerCase().split(' ');

    const products = await this.productsRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.restaurant', 'restaurant')
      .where('product.isAvailable = :available', { available: true })
      .andWhere('restaurant.isApproved = :approved', { approved: true })
      .getMany();

    // Score and rank results
    const scoredProducts = products.map((product) => {
      let score = 0;
      const name = product.name.toLowerCase();
      const description = (product.description || '').toLowerCase();
      const category = (product.category?.name || '').toLowerCase();

      for (const term of searchTerms) {
        if (name.includes(term)) score += 10;
        if (description.includes(term)) score += 5;
        if (category.includes(term)) score += 3;
      }

      return { ...product, relevanceScore: score };
    });

    return scoredProducts
      .filter((p) => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);
  }

  // Suggest delivery time based on historical data
  async predictDeliveryTime(restaurantId: string, distanceKm: number) {
    // Get average preparation time from recent orders
    const recentOrders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.restaurantId = :restaurantId', { restaurantId })
      .andWhere('order.deliveredAt IS NOT NULL')
      .andWhere('order.confirmedAt IS NOT NULL')
      .orderBy('order.createdAt', 'DESC')
      .limit(50)
      .getMany();

    let avgPrepTime = 20; // Default 20 minutes

    if (recentOrders.length > 0) {
      const prepTimes = recentOrders
        .filter((o) => o.confirmedAt && o.readyAt)
        .map((o) => (o.readyAt!.getTime() - o.confirmedAt!.getTime()) / 60000);

      if (prepTimes.length > 0) {
        avgPrepTime = prepTimes.reduce((a, b) => a + b, 0) / prepTimes.length;
      }
    }

    // Estimate travel time (25 km/h average)
    const travelTime = (distanceKm / 25) * 60;

    // Add buffer for pickup
    const pickupBuffer = 5;

    const totalMinutes = Math.ceil(avgPrepTime + travelTime + pickupBuffer);

    return {
      estimatedMinutes: totalMinutes,
      breakdown: {
        preparation: Math.ceil(avgPrepTime),
        travel: Math.ceil(travelTime),
        pickup: pickupBuffer,
      },
      confidence: recentOrders.length >= 20 ? 'high' : recentOrders.length >= 5 ? 'medium' : 'low',
    };
  }

  // Analyze order patterns for business insights
  async getBusinessInsights(restaurantId: string) {
    const orders = await this.ordersRepository.find({
      where: { restaurantId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: 500,
    });

    // Peak hours analysis
    const hourlyOrders: Record<number, number> = {};
    orders.forEach((order) => {
      const hour = order.createdAt.getHours();
      hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourlyOrders)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Day of week analysis
    const dailyOrders: Record<number, number> = {};
    orders.forEach((order) => {
      const day = order.createdAt.getDay();
      dailyOrders[day] = (dailyOrders[day] || 0) + 1;
    });

    // Average order value
    const avgOrderValue =
      orders.reduce((sum, o) => sum + Number(o.total), 0) / orders.length || 0;

    return {
      peakHours,
      dailyOrders,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      totalOrders: orders.length,
    };
  }

  // Chat assistant (placeholder for OpenAI integration)
  async chatAssistant(userId: string, message: string) {
    // Simple rule-based responses
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('estado') || lowerMessage.includes('pedido')) {
      return {
        response: 'Para ver el estado de tu pedido, ve a la sección "Mis Pedidos" en la app.',
        actions: [{ type: 'navigate', target: 'orders' }],
      };
    }

    if (lowerMessage.includes('ayuda') || lowerMessage.includes('soporte')) {
      return {
        response: '¿En qué puedo ayudarte? Puedo asistirte con: pedidos, pagos, direcciones de entrega, o problemas técnicos.',
        actions: [],
      };
    }

    if (lowerMessage.includes('cancelar')) {
      return {
        response: 'Para cancelar un pedido, ve a "Mis Pedidos", selecciona el pedido y toca "Cancelar". Solo puedes cancelar pedidos que aún no han sido confirmados.',
        actions: [{ type: 'navigate', target: 'orders' }],
      };
    }

    return {
      response: '¡Hola! Soy el asistente de Quiúbole. ¿En qué puedo ayudarte hoy?',
      actions: [],
    };
  }
}
