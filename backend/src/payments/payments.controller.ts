import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-intent')
  @Roles(UserRole.CLIENT)
  createPaymentIntent(@Body() body: { amount: number; currency?: string }) {
    return this.paymentsService.createPaymentIntent(body.amount, body.currency);
  }

  @Get('confirm/:paymentIntentId')
  confirmPayment(@Param('paymentIntentId') paymentIntentId: string) {
    return this.paymentsService.confirmPayment(paymentIntentId);
  }

  @Post('refund')
  @Roles(UserRole.ADMIN)
  createRefund(@Body() body: { paymentIntentId: string; amount?: number }) {
    return this.paymentsService.createRefund(body.paymentIntentId, body.amount);
  }
}
