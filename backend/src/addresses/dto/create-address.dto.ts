import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAddressDto {
  @IsString()
  label: string;

  @IsString()
  street: string;

  @IsOptional()
  @IsString()
  exteriorNumber?: string;

  @IsOptional()
  @IsString()
  interiorNumber?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsOptional()
  @IsString()
  references?: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
