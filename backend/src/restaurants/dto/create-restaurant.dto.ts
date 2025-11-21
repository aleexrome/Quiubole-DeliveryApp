import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRestaurantDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsString()
  address: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryFee?: number;

  @IsOptional()
  @IsString()
  estimatedDeliveryTime?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minimumOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  coverageRadius?: number;

  @IsOptional()
  schedule?: {
    day: string;
    open: string;
    close: string;
    isOpen: boolean;
  }[];
}
