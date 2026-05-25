// ==========================================
// CoverageZonesController
//
//   GET    /coverage-zones/active   — público, para dropdown de registro
//   GET    /coverage-zones          — admin, todas las zonas
//   POST   /coverage-zones          — admin, crear zona
//   PATCH  /coverage-zones/:id      — admin, editar / toggle activa
// ==========================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoverageZonesService } from './coverage-zones.service';
import { UserRole } from '../common/enums/user-role.enum';
import { CoverageZone } from './coverage-zone.entity';

@Controller('coverage-zones')
export class CoverageZonesController {
  constructor(private readonly service: CoverageZonesService) {}

  @Public()
  @Get('active')
  async listActive() {
    return this.service.listActive();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async listAll(@Request() req: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo admin');
    }
    return this.service.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: Partial<CoverageZone>, @Request() req: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo admin');
    }
    return this.service.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CoverageZone>,
    @Request() req: any,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo admin');
    }
    return this.service.update(id, dto);
  }
}
