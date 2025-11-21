import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { OrderStatus, PaymentStatus } from '../order.entity';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsUUID()
  driverId?: string;
}
