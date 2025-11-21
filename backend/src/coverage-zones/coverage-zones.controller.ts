import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CoverageZonesService } from './coverage-zones.service';
import { CreateCoverageZoneDto } from './dto/create-coverage-zone.dto';
import { UpdateCoverageZoneDto } from './dto/update-coverage-zone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/user.entity';

@Controller('coverage-zones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoverageZonesController {
  constructor(private readonly coverageZonesService: CoverageZonesService) {}

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  create(@Body() createCoverageZoneDto: CreateCoverageZoneDto) {
    return this.coverageZonesService.create(createCoverageZoneDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.coverageZonesService.findAll();
  }

  @Public()
  @Get('restaurant/:restaurantId')
  findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.coverageZonesService.findByRestaurant(restaurantId);
  }

  @Public()
  @Get('check')
  checkCoverage(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('restaurantId') restaurantId?: string,
  ) {
    return this.coverageZonesService.checkCoverage(Number(latitude), Number(longitude), restaurantId);
  }

  @Public()
  @Get('restaurants-nearby')
  findRestaurantsInRange(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius?: number,
  ) {
    return this.coverageZonesService.findRestaurantsInRange(Number(latitude), Number(longitude), Number(radius) || 10);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coverageZonesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateCoverageZoneDto: UpdateCoverageZoneDto) {
    return this.coverageZonesService.update(id, updateCoverageZoneDto);
  }

  @Delete(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.coverageZonesService.remove(id);
  }
}
