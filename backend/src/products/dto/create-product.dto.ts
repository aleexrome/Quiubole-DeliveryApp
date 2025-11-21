import { IsString, IsOptional, IsNumber, IsBoolean, IsUUID, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  preparationTime?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];

  @IsOptional()
  extras?: {
    name: string;
    price: number;
  }[];

  @IsUUID()
  restaurantId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
