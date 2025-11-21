// ==========================================
// FINANCE SERVICE - Estado de Cuenta Admin
// ==========================================

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Order } from '../orders/order.entity';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  // Obtener resumen financiero
  async getFinancialSummary(period: 'today' | 'week' | 'month') {
    const startDate = this.getStartDate(period);
    const endDate = new Date();

    // Obtener todas las ordenes del periodo
    const orders = await this.ordersRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
        status: 'delivered',
      },
    });

    // Calcular totales
    const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = orders.length;

    // Pagos con tarjeta vs efectivo
    const cardOrders = orders.filter(o => o.paymentMethod === 'card');
    const cashOrders = orders.filter(o => o.paymentMethod === 'cash');

    const cardPayments = cardOrders.reduce((sum, o) => sum + o.total, 0);
    const cashPayments = cashOrders.reduce((sum, o) => sum + o.total, 0);

    // Comisiones (15% de restaurantes + 8% tarifa servicio)
    const subtotals = orders.reduce((sum, o) => sum + o.subtotal, 0);
    const restaurantCommissions = subtotals * 0.15;
    const serviceFeesCollected = orders.reduce((sum, o) => sum + o.serviceFee, 0);
    const deliveryFeesCollected = orders.reduce((sum, o) => sum + o.deliveryFee, 0);

    // Lo que debemos pagar
    const owedToRestaurants = subtotals - restaurantCommissions;
    const owedToDrivers = deliveryFeesCollected * 0.7; // 70% para repartidor

    // Efectivo pendiente de liquidar
    const pendingFromDrivers = await this.getPendingCashSettlements();

    // Ganancia neta
    const netProfit = restaurantCommissions + serviceFeesCollected + (deliveryFeesCollected * 0.3);

    return {
      totalSales,
      totalOrders,
      restaurantCommissions,
      serviceFeesCollected,
      deliveryFeesCollected,
      owedToRestaurants,
      owedToDrivers,
      pendingFromDrivers,
      netProfit,
      cardPayments,
      cashPayments,
    };
  }

  // Obtener transacciones
  async getTransactions(period: 'today' | 'week' | 'month', page: number = 1) {
    const startDate = this.getStartDate(period);
    const limit = 50;

    const orders = await this.ordersRepository.find({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
      relations: ['restaurant', 'driver', 'customer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return orders.map(order => ({
      id: order.id,
      type: 'order',
      orderNumber: order.orderNumber,
      description: this.getOrderDescription(order),
      amount: order.total,
      fee: order.serviceFee + (order.subtotal * 0.15),
      net: order.serviceFee + (order.subtotal * 0.15) + (order.deliveryFee * 0.3),
      status: order.status === 'delivered' ? 'completed' : 'pending',
      paymentMethod: order.paymentMethod,
      restaurant: order.restaurant?.name,
      driver: order.driver?.name,
      customer: order.customer?.name,
      createdAt: order.createdAt,
    }));
  }

  // Obtener liquidaciones pendientes de repartidores
  async getPendingDriverSettlements() {
    // En produccion esto vendria de una tabla de balances
    // Por ahora retornamos ejemplo
    return [
      {
        driverId: '1',
        driverName: 'Juan Pérez',
        driverPhone: '55 1234 5678',
        amountOwed: 850.00,
        ordersCount: 8,
        lastOrderTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        driverId: '2',
        driverName: 'Carlos López',
        driverPhone: '55 9876 5432',
        amountOwed: 420.00,
        ordersCount: 4,
        lastOrderTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      },
    ];
  }

  // Obtener pagos pendientes a restaurantes
  async getPendingRestaurantPayouts() {
    // Sumar pedidos de la semana por restaurante
    const weekStart = this.getStartDate('week');

    const result = await this.ordersRepository
      .createQueryBuilder('order')
      .select('order.restaurantId', 'restaurantId')
      .addSelect('restaurant.name', 'restaurantName')
      .addSelect('COUNT(*)', 'ordersCount')
      .addSelect('SUM(order.subtotal * 0.85)', 'amountOwed') // 85% (100% - 15% comision)
      .leftJoin('order.restaurant', 'restaurant')
      .where('order.createdAt >= :weekStart', { weekStart })
      .andWhere('order.status = :status', { status: 'delivered' })
      .groupBy('order.restaurantId')
      .addGroupBy('restaurant.name')
      .getRawMany();

    return result.map(r => ({
      restaurantId: r.restaurantId,
      restaurantName: r.restaurantName,
      ordersCount: parseInt(r.ordersCount),
      amountOwed: parseFloat(r.amountOwed || 0),
    }));
  }

  // Confirmar liquidacion de repartidor
  async confirmDriverSettlement(driverId: string, amount: number, reference: string) {
    // Registrar el pago
    // Actualizar balance del repartidor
    // Desbloquear si estaba bloqueado

    return {
      success: true,
      message: 'Liquidación confirmada',
      newBalance: 0,
    };
  }

  // Confirmar pago a restaurante
  async confirmRestaurantPayout(restaurantId: string, amount: number, reference: string) {
    // Registrar el pago
    // Marcar ordenes como pagadas al restaurante

    return {
      success: true,
      message: 'Pago registrado',
    };
  }

  // Exportar reporte
  async exportReport(period: 'today' | 'week' | 'month', format: 'csv' | 'pdf') {
    const summary = await this.getFinancialSummary(period);
    const transactions = await this.getTransactions(period);

    // En produccion generarias CSV o PDF real
    if (format === 'csv') {
      return this.generateCSV(summary, transactions);
    } else {
      return this.generatePDF(summary, transactions);
    }
  }

  // Helpers
  private getStartDate(period: 'today' | 'week' | 'month'): Date {
    const now = new Date();
    switch (period) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0));
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return weekStart;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setDate(now.getDate() - 30);
        return monthStart;
      default:
        return new Date(now.setHours(0, 0, 0, 0));
    }
  }

  private getOrderDescription(order: Order): string {
    switch (order.status) {
      case 'delivered':
        return 'Pedido completado';
      case 'cancelled':
        return 'Pedido cancelado';
      default:
        return 'Pedido en proceso';
    }
  }

  private async getPendingCashSettlements(): Promise<number> {
    // Sumar lo que deben los repartidores de pedidos en efectivo
    // que aun no han liquidado
    return 1270.00; // Ejemplo
  }

  private generateCSV(summary: any, transactions: any[]): string {
    let csv = 'ESTADO DE CUENTA QUIUBOLE\n\n';
    csv += 'RESUMEN\n';
    csv += `Ventas Totales,${summary.totalSales}\n`;
    csv += `Total Pedidos,${summary.totalOrders}\n`;
    csv += `Comisiones Restaurantes,${summary.restaurantCommissions}\n`;
    csv += `Tarifas de Servicio,${summary.serviceFeesCollected}\n`;
    csv += `Ganancia Neta,${summary.netProfit}\n\n`;
    csv += 'TRANSACCIONES\n';
    csv += 'Orden,Restaurante,Monto,Comisión,Método,Fecha\n';

    transactions.forEach(t => {
      csv += `${t.orderNumber},${t.restaurant},${t.amount},${t.fee},${t.paymentMethod},${t.createdAt}\n`;
    });

    return csv;
  }

  private generatePDF(summary: any, transactions: any[]): Buffer {
    // En produccion usarias pdfkit o similar
    return Buffer.from('PDF content');
  }
}
