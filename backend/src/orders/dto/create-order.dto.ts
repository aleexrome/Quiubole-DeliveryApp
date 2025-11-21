import { IsString, IsOptional, IsNumber, IsUUID, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsString()
  productName: string;

  @Type(() => Number)
  @IsNumber()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  unitPrice: number;

  @IsOptional()
  extras?: { name: string; price: number }[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  deliveryAddress: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryLatitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryLongitude?: number;

  @IsOptional()
  @IsString()
  deliveryNotes?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
