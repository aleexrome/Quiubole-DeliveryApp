// ==========================================
// PAYMENTS CONTROLLER
// ==========================================

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  RawBodyRequest,
  Req,
  Headers,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// DTOs
class CreatePaymentIntentDto {
  amount: number;
  orderId: string;
  description?: string;
  paymentMethodId?: string;
}

class SetDefaultPaymentMethodDto {
  paymentMethodId: string;
}

class OxxoPaymentDto {
  amount: number;
  orderId: string;
}

class RefundDto {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
}

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ==========================================
  // CONFIGURACIÓN DE TARJETAS
  // ==========================================

  // Crear SetupIntent para agregar nueva tarjeta
  @Post('setup-intent')
  @UseGuards(JwtAuthGuard)
  async createSetupIntent(@Request() req) {
    return this.paymentsService.createSetupIntent(
      req.user.id,
      req.user.email,
      req.user.name,
    );
  }

  // Obtener métodos de pago guardados
  @Get('payment-methods')
  @UseGuards(JwtAuthGuard)
  async getPaymentMethods(@Request() req) {
    return this.paymentsService.getPaymentMethods(req.user.id);
  }

  // Establecer método de pago por defecto
  @Post('payment-methods/default')
  @UseGuards(JwtAuthGuard)
  async setDefaultPaymentMethod(
    @Request() req,
    @Body() body: SetDefaultPaymentMethodDto,
  ) {
    await this.paymentsService.setDefaultPaymentMethod(
      req.user.id,
      body.paymentMethodId,
    );
    return { success: true };
  }

  // Eliminar método de pago
  @Delete('payment-methods/:id')
  @UseGuards(JwtAuthGuard)
  async removePaymentMethod(@Request() req, @Param('id') paymentMethodId: string) {
    await this.paymentsService.removePaymentMethod(req.user.id, paymentMethodId);
    return { success: true };
  }

  // ==========================================
  // PAGOS
  // ==========================================

  // Crear PaymentIntent para cobrar
  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(@Request() req, @Body() body: CreatePaymentIntentDto) {
    const amountInCents = this.paymentsService.parseAmount(body.amount);

    return this.paymentsService.createPaymentIntent(
      req.user.id,
      req.user.email,
      req.user.name,
      amountInCents,
      body.orderId,
      body.description || `Pedido Quiúbole #${body.orderId}`,
      body.paymentMethodId,
    );
  }

  // Verificar estado de pago
  @Get('payment-intent/:id/status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(@Param('id') paymentIntentId: string) {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }

  // ==========================================
  // OXXO PAY
  // ==========================================

  @Post('oxxo')
  @UseGuards(JwtAuthGuard)
  async createOxxoPayment(@Request() req, @Body() body: OxxoPaymentDto) {
    const amountInCents = this.paymentsService.parseAmount(body.amount);

    return this.paymentsService.createOxxoPayment(
      req.user.id,
      req.user.email,
      req.user.name,
      amountInCents,
      body.orderId,
    );
  }

  // ==========================================
  // REEMBOLSOS (Admin)
  // ==========================================

  @Post('refund')
  @UseGuards(JwtAuthGuard)
  // @Roles('admin') // Descomentar para restringir a admin
  async refundPayment(@Body() body: RefundDto) {
    const amountInCents = body.amount
      ? this.paymentsService.parseAmount(body.amount)
      : undefined;

    await this.paymentsService.refundPayment(
      body.paymentIntentId,
      amountInCents,
      body.reason,
    );

    return { success: true, message: 'Reembolso procesado' };
  }

  // ==========================================
  // WEBHOOKS (No requiere auth - verificación por firma)
  // ==========================================

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      return { received: false, error: 'No raw body' };
    }

    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
