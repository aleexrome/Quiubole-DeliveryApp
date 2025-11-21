import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_default',
    );
  }

  async createPaymentIntent(amount: number, currency: string = 'mxn'): Promise<any> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
    };
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<any> {
    const refundParams: any = { payment_intent: paymentIntentId };
    if (amount) {
      refundParams.amount = Math.round(amount * 100);
    }
    const refund = await this.stripe.refunds.create(refundParams);
    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100,
    };
  }

  async createCustomer(email: string, name: string): Promise<string> {
    const customer = await this.stripe.customers.create({ email, name });
    return customer.id;
  }

  async attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<void> {
    await this.stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  }

  async listPaymentMethods(customerId: string): Promise<any[]> {
    const methods = await this.stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    return methods.data.map((m) => ({
      id: m.id,
      brand: m.card?.brand,
      last4: m.card?.last4,
      expMonth: m.card?.exp_month,
      expYear: m.card?.exp_year,
    }));
  }
}
