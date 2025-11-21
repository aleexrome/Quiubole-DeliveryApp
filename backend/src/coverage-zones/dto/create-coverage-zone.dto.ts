import { IsString, IsNumber, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCoverageZoneDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  centerLatitude: number;

  @Type(() => Number)
  @IsNumber()
  centerLongitude: number;

  @Type(() => Number)
  @IsNumber()
  radiusKm: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extraDeliveryFee?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsUUID()
  restaurantId: string;
}
