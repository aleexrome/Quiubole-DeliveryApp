// ==========================================
// PAYMENTS SERVICE - Mobile (Stripe)
// ==========================================

import { Alert, Linking } from 'react-native';
import api from './api';

// Tipos
export interface PaymentMethod {
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

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: string;
}

export interface OxxoPayment {
  voucherUrl: string;
  expiresAt: Date;
}

// Constantes
const CARD_BRANDS: Record<string, { name: string; icon: string }> = {
  visa: { name: 'Visa', icon: 'cc-visa' },
  mastercard: { name: 'Mastercard', icon: 'cc-mastercard' },
  amex: { name: 'American Express', icon: 'cc-amex' },
  discover: { name: 'Discover', icon: 'cc-discover' },
  diners: { name: 'Diners Club', icon: 'cc-diners-club' },
  jcb: { name: 'JCB', icon: 'cc-jcb' },
  unionpay: { name: 'UnionPay', icon: 'credit-card' },
  unknown: { name: 'Tarjeta', icon: 'credit-card' },
};

class PaymentService {
  // ==========================================
  // MÉTODOS DE PAGO
  // ==========================================

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await api.get('/payments/payment-methods');
      return response.data;
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  }

  async createSetupIntent(): Promise<{ clientSecret: string } | null> {
    try {
      const response = await api.post('/payments/setup-intent');
      return response.data;
    } catch (error) {
      console.error('Error creating setup intent:', error);
      return null;
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await api.post('/payments/payment-methods/default', { paymentMethodId });
      return true;
    } catch (error) {
      console.error('Error setting default payment method:', error);
      return false;
    }
  }

  async removePaymentMethod(paymentMethodId: string): Promise<boolean> {
    try {
      await api.delete(`/payments/payment-methods/${paymentMethodId}`);
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      return false;
    }
  }

  // ==========================================
  // PAGOS
  // ==========================================

  async createPaymentIntent(
    amount: number,
    orderId: string,
    paymentMethodId?: string,
  ): Promise<PaymentIntent | null> {
    try {
      const response = await api.post('/payments/create-payment-intent', {
        amount,
        orderId,
        paymentMethodId,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  }

  async checkPaymentStatus(paymentIntentId: string): Promise<{ status: string; orderId?: string } | null> {
    try {
      const response = await api.get(`/payments/payment-intent/${paymentIntentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return null;
    }
  }

  // ==========================================
  // OXXO PAY
  // ==========================================

  async createOxxoPayment(amount: number, orderId: string): Promise<OxxoPayment | null> {
    try {
      const response = await api.post('/payments/oxxo', { amount, orderId });
      return {
        ...response.data,
        expiresAt: new Date(response.data.expiresAt),
      };
    } catch (error) {
      console.error('Error creating OXXO payment:', error);
      return null;
    }
  }

  openOxxoVoucher(voucherUrl: string) {
    Linking.openURL(voucherUrl).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el voucher de OXXO');
    });
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  getCardBrandInfo(brand: string): { name: string; icon: string } {
    return CARD_BRANDS[brand.toLowerCase()] || CARD_BRANDS.unknown;
  }

  formatCardNumber(last4: string): string {
    return `•••• •••• •••• ${last4}`;
  }

  formatExpiry(month: number, year: number): string {
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(-2)}`;
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(amount);
  }

  // Validación básica de tarjeta (Luhn algorithm)
  validateCardNumber(cardNumber: string): boolean {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  validateExpiry(month: number, year: number): boolean {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const fullYear = year < 100 ? 2000 + year : year;

    if (fullYear < currentYear) return false;
    if (fullYear === currentYear && month < currentMonth) return false;
    if (month < 1 || month > 12) return false;

    return true;
  }

  validateCVC(cvc: string): boolean {
    const digits = cvc.replace(/\D/g, '');
    return digits.length >= 3 && digits.length <= 4;
  }

  detectCardBrand(cardNumber: string): string {
    const digits = cardNumber.replace(/\D/g, '');

    if (/^4/.test(digits)) return 'visa';
    if (/^5[1-5]/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^6(?:011|5)/.test(digits)) return 'discover';
    if (/^3(?:0[0-5]|[68])/.test(digits)) return 'diners';
    if (/^35(?:2[89]|[3-8])/.test(digits)) return 'jcb';
    if (/^62/.test(digits)) return 'unionpay';

    return 'unknown';
  }
}

export const paymentService = new PaymentService();
export default paymentService;
