// ==========================================
// AddressesController
//
//   GET    /addresses                 — listar mis direcciones
//   GET    /addresses/:id             — obtener una
//   POST   /addresses                 — crear nueva
//   PATCH  /addresses/:id             — actualizar
//   POST   /addresses/:id/default     — marcar como default
//   DELETE /addresses/:id             — borrar
// ==========================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';

class AddressDto {
  @IsOptional() @IsString() label?: string;
  @IsString() street: string;
  @IsOptional() @IsString() apartment?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() country?: string;
  @IsNumber() latitude: number;
  @IsNumber() longitude: number;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

class UpdateAddressDto {
  @IsOptional() @IsString() label?: string;
  @IsOptional() @IsString() street?: string;
  @IsOptional() @IsString() apartment?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() zipCode?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly service: AddressesService) {}

  @Get()
  async listMine(@Request() req: any) {
    return this.service.listMine(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.service.findOne(id, req.user.id);
  }

  @Post()
  async create(@Body() dto: AddressDto, @Request() req: any) {
    return this.service.create(req.user.id, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @Request() req: any,
  ) {
    return this.service.update(id, req.user.id, dto);
  }

  @Post(':id/default')
  async setDefault(@Param('id') id: string, @Request() req: any) {
    return this.service.setDefault(id, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.service.remove(id, req.user.id);
  }
}
