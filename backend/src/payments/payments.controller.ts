import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('methods')
  async getPaymentMethods(@Request() req) {
    return this.paymentsService.getUserPaymentMethods(req.user.id);
  }

  @Post('methods')
  async addPaymentMethod(@Request() req, @Body() body: any) {
    return this.paymentsService.addPaymentMethod(req.user.id, body);
  }

  @Delete('methods/:id')
  async deletePaymentMethod(@Request() req, @Param('id') id: string) {
    return this.paymentsService.deletePaymentMethod(req.user.id, id);
  }

  @Put('methods/:id/default')
  async setDefault(@Request() req, @Param('id') id: string) {
    return this.paymentsService.setDefaultPaymentMethod(req.user.id, id);
  }

  @Post('process/:orderId')
  async processPayment(
    @Param('orderId') orderId: string,
    @Body('paymentMethodId') paymentMethodId: string,
  ) {
    return this.paymentsService.processPayment(orderId, paymentMethodId);
  }

  @Post('refund/:orderId')
  async refundPayment(@Param('orderId') orderId: string) {
    return this.paymentsService.refundPayment(orderId);
  }
}
