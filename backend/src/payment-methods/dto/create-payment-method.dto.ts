import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { PaymentMethodType } from '../payment-method.entity';

export class CreatePaymentMethodDto {
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @IsOptional()
  @IsString()
  stripePaymentMethodId?: string;

  @IsOptional()
  @IsString()
  cardBrand?: string;

  @IsOptional()
  @IsString()
  cardLast4?: string;

  @IsOptional()
  @IsNumber()
  cardExpMonth?: number;

  @IsOptional()
  @IsNumber()
  cardExpYear?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
