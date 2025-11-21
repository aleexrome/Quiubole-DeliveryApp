import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('payment-methods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@Body() createPaymentMethodDto: CreatePaymentMethodDto, @CurrentUser() user: any) {
    return this.paymentMethodsService.create(createPaymentMethodDto, user.id);
  }

  @Get()
  @Roles(UserRole.CLIENT)
  findMyPaymentMethods(@CurrentUser() user: any) {
    return this.paymentMethodsService.findByUser(user.id);
  }

  @Get('default')
  @Roles(UserRole.CLIENT)
  getDefault(@CurrentUser() user: any) {
    return this.paymentMethodsService.getDefault(user.id);
  }

  @Patch(':id/set-default')
  @Roles(UserRole.CLIENT)
  setDefault(@Param('id') id: string, @CurrentUser() user: any) {
    return this.paymentMethodsService.setDefault(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.CLIENT)
  remove(@Param('id') id: string) {
    return this.paymentMethodsService.remove(id);
  }
}
