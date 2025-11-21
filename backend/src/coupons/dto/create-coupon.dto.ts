import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from '../coupon.entity';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @Type(() => Number)
  @IsNumber()
  discountValue: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minimumOrder?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maximumDiscount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  usageLimit?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;
}
