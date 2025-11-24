import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '../payment-methods/payment-method.entity';
import { Order } from '../orders/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async getUserPaymentMethods(userId: string) {
    return this.paymentMethodsRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async addPaymentMethod(userId: string, data: any) {
    // In production, integrate with Stripe/MercadoPago to tokenize card
    const paymentMethod = this.paymentMethodsRepository.create({
      userId,
      type: data.type,
      last4: data.last4 || data.cardNumber?.slice(-4),
      brand: data.brand,
      expiryMonth: data.expiryMonth,
      expiryYear: data.expiryYear,
      isDefault: data.isDefault || false,
    });

    if (data.isDefault) {
      await this.paymentMethodsRepository.update(
        { userId },
        { isDefault: false },
      );
    }

    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async deletePaymentMethod(userId: string, paymentMethodId: string) {
    const method = await this.paymentMethodsRepository.findOne({
      where: { id: paymentMethodId, userId },
    });

    if (!method) {
      throw new BadRequestException('Payment method not found');
    }

    await this.paymentMethodsRepository.remove(method);
    return { success: true };
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    await this.paymentMethodsRepository.update(
      { userId },
      { isDefault: false },
    );

    await this.paymentMethodsRepository.update(
      { id: paymentMethodId, userId },
      { isDefault: true },
    );

    return { success: true };
  }

  async processPayment(orderId: string, paymentMethodId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    // In production, process payment through payment gateway
    // For now, simulate successful payment
    order.isPaid = true;
    order.paidAt = new Date();

    await this.ordersRepository.save(order);

    return {
      success: true,
      transactionId: `TXN-${Date.now()}`,
      amount: order.total,
    };
  }

  async refundPayment(orderId: string) {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });

    if (!order || !order.isPaid) {
      throw new BadRequestException('Order not found or not paid');
    }

    // In production, process refund through payment gateway
    order.isRefunded = true;
    order.refundedAt = new Date();

    await this.ordersRepository.save(order);

    return {
      success: true,
      refundId: `REF-${Date.now()}`,
      amount: order.total,
    };
  }
}
