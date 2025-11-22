// ==========================================
// PAYMENTS SERVICE - Stripe Integration
// ==========================================

import { Injectable, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';

// Interfaces
interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: string;
}

interface CustomerBalance {
  userId: string;
  stripeCustomerId: string;
  defaultPaymentMethodId?: string;
}

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe;

  // En producción esto sería una entidad TypeORM
  private customerBalances: Map<string, CustomerBalance> = new Map();

  onModuleInit() {
    this.initializeStripe();
  }

  private initializeStripe() {
    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      this.logger.warn('Stripe secret key not configured - payments will be simulated');
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });

    this.logger.log('Stripe initialized successfully');
  }

  // ==========================================
  // CLIENTES
  // ==========================================

  async getOrCreateCustomer(userId: string, email: string, name: string): Promise<string> {
    // Buscar cliente existente
    const existingBalance = this.customerBalances.get(userId);
    if (existingBalance?.stripeCustomerId) {
      return existingBalance.stripeCustomerId;
    }

    if (!this.stripe) {
      // Modo simulación
      const fakeCustomerId = `cus_fake_${userId}`;
      this.customerBalances.set(userId, {
        userId,
        stripeCustomerId: fakeCustomerId,
      });
      return fakeCustomerId;
    }

    try {
      // Crear cliente en Stripe
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      this.customerBalances.set(userId, {
        userId,
        stripeCustomerId: customer.id,
      });

      this.logger.log(`Created Stripe customer ${customer.id} for user ${userId}`);
      return customer.id;
    } catch (error) {
      this.logger.error('Error creating Stripe customer:', error);
      throw new BadRequestException('Error al crear cuenta de pagos');
    }
  }

  // ==========================================
  // MÉTODOS DE PAGO
  // ==========================================

  async createSetupIntent(userId: string, email: string, name: string): Promise<{ clientSecret: string }> {
    const customerId = await this.getOrCreateCustomer(userId, email, name);

    if (!this.stripe) {
      return { clientSecret: 'seti_fake_secret_' + Date.now() };
    }

    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        metadata: {
          userId,
        },
      });

      return { clientSecret: setupIntent.client_secret! };
    } catch (error) {
      this.logger.error('Error creating setup intent:', error);
      throw new BadRequestException('Error al iniciar configuración de pago');
    }
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const balance = this.customerBalances.get(userId);
    if (!balance?.stripeCustomerId) {
      return [];
    }

    if (!this.stripe) {
      // Datos de prueba
      return [
        {
          id: 'pm_fake_1',
          type: 'card',
          card: {
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2025,
          },
          isDefault: true,
        },
      ];
    }

    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: balance.stripeCustomerId,
        type: 'card',
      });

      return paymentMethods.data.map((pm) => ({
        id: pm.id,
        type: 'card' as const,
        card: {
          brand: pm.card!.brand,
          last4: pm.card!.last4,
          expMonth: pm.card!.exp_month,
          expYear: pm.card!.exp_year,
        },
        isDefault: pm.id === balance.defaultPaymentMethodId,
      }));
    } catch (error) {
      this.logger.error('Error getting payment methods:', error);
      return [];
    }
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    const balance = this.customerBalances.get(userId);
    if (!balance) {
      throw new BadRequestException('Usuario no tiene cuenta de pagos');
    }

    if (this.stripe) {
      await this.stripe.customers.update(balance.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    balance.defaultPaymentMethodId = paymentMethodId;
    this.customerBalances.set(userId, balance);
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    if (!this.stripe) {
      this.logger.log(`[SIMULATED] Removed payment method ${paymentMethodId}`);
      return;
    }

    try {
      await this.stripe.paymentMethods.detach(paymentMethodId);
      this.logger.log(`Removed payment method ${paymentMethodId} for user ${userId}`);
    } catch (error) {
      this.logger.error('Error removing payment method:', error);
      throw new BadRequestException('Error al eliminar método de pago');
    }
  }

  // ==========================================
  // PAGOS
  // ==========================================

  async createPaymentIntent(
    userId: string,
    email: string,
    name: string,
    amount: number, // En centavos (ej: 10000 = $100.00 MXN)
    orderId: string,
    description: string,
    paymentMethodId?: string,
  ): Promise<PaymentIntent> {
    const customerId = await this.getOrCreateCustomer(userId, email, name);

    if (!this.stripe) {
      // Modo simulación
      return {
        id: 'pi_fake_' + Date.now(),
        clientSecret: 'pi_fake_secret_' + Date.now(),
        amount,
        status: 'requires_payment_method',
      };
    }

    try {
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount,
        currency: 'mxn',
        customer: customerId,
        description,
        metadata: {
          userId,
          orderId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      };

      // Si se proporciona método de pago, usarlo directamente
      if (paymentMethodId) {
        paymentIntentData.payment_method = paymentMethodId;
        paymentIntentData.confirm = true;
        paymentIntentData.return_url = `${process.env.MOBILE_SCHEME || 'quiubole'}://payment-complete`;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentData);

      return {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw new BadRequestException('Error al procesar pago');
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<{ status: string; orderId?: string }> {
    if (!this.stripe) {
      return { status: 'succeeded', orderId: 'fake_order' };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status,
        orderId: paymentIntent.metadata.orderId,
      };
    } catch (error) {
      this.logger.error('Error confirming payment:', error);
      throw new BadRequestException('Error al confirmar pago');
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number, reason?: string): Promise<void> {
    if (!this.stripe) {
      this.logger.log(`[SIMULATED] Refund for ${paymentIntentId}: ${amount || 'full'}`);
      return;
    }

    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
      };

      if (amount) {
        refundData.amount = amount;
      }

      await this.stripe.refunds.create(refundData);
      this.logger.log(`Refund created for payment ${paymentIntentId}`);
    } catch (error) {
      this.logger.error('Error creating refund:', error);
      throw new BadRequestException('Error al procesar reembolso');
    }
  }

  // ==========================================
  // WEBHOOKS
  // ==========================================

  async handleWebhook(body: Buffer, signature: string): Promise<{ received: boolean; event?: string }> {
    if (!this.stripe) {
      return { received: true, event: 'simulated' };
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      this.logger.warn('Stripe webhook secret not configured');
      return { received: false };
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Procesar eventos
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleRefunded(event.data.object as Stripe.Charge);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Para futuras suscripciones de restaurantes
        break;

      default:
        this.logger.log(`Unhandled webhook event: ${event.type}`);
    }

    return { received: true, event: event.type };
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      // Actualizar estado del pedido a pagado
      // await this.ordersService.markAsPaid(orderId, paymentIntent.id);
      this.logger.log(`Order ${orderId} marked as paid`);
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    const orderId = paymentIntent.metadata.orderId;

    if (orderId) {
      // Notificar al usuario del fallo
      // await this.notificationsService.sendToUser(...)
      this.logger.log(`Order ${orderId} payment failed`);
    }
  }

  private async handleRefunded(charge: Stripe.Charge) {
    this.logger.log(`Payment refunded: ${charge.id}`);
    // Actualizar estado del pedido
  }

  // ==========================================
  // OXXO PAY (Pagos en efectivo en tiendas)
  // ==========================================

  async createOxxoPayment(
    userId: string,
    email: string,
    name: string,
    amount: number,
    orderId: string,
  ): Promise<{ voucherUrl: string; expiresAt: Date }> {
    const customerId = await this.getOrCreateCustomer(userId, email, name);

    if (!this.stripe) {
      return {
        voucherUrl: 'https://fake-oxxo-voucher.com/' + orderId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      };
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount,
        currency: 'mxn',
        customer: customerId,
        payment_method_types: ['oxxo'],
        payment_method_data: {
          type: 'oxxo',
          billing_details: {
            name,
            email,
          },
        },
        metadata: {
          userId,
          orderId,
        },
      });

      // Confirmar para generar el voucher
      const confirmedIntent = await this.stripe.paymentIntents.confirm(paymentIntent.id);

      const oxxoDetails = confirmedIntent.next_action?.oxxo_display_details;

      return {
        voucherUrl: oxxoDetails?.hosted_voucher_url || '',
        expiresAt: new Date((oxxoDetails?.expires_after || 0) * 1000),
      };
    } catch (error) {
      this.logger.error('Error creating OXXO payment:', error);
      throw new BadRequestException('Error al generar pago OXXO');
    }
  }

  // ==========================================
  // TRANSFERENCIAS A RESTAURANTES
  // ==========================================

  async createTransferToRestaurant(
    restaurantStripeAccountId: string,
    amount: number,
    orderId: string,
  ): Promise<string> {
    if (!this.stripe) {
      return 'tr_fake_' + Date.now();
    }

    try {
      const transfer = await this.stripe.transfers.create({
        amount,
        currency: 'mxn',
        destination: restaurantStripeAccountId,
        metadata: {
          orderId,
        },
      });

      return transfer.id;
    } catch (error) {
      this.logger.error('Error creating transfer:', error);
      throw new BadRequestException('Error al transferir fondos');
    }
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  formatAmount(amount: number): string {
    return `$${(amount / 100).toFixed(2)} MXN`;
  }

  parseAmount(amountInPesos: number): number {
    return Math.round(amountInPesos * 100);
  }
}
