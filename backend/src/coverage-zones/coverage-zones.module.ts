import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoverageZone } from './coverage-zone.entity';
import { CoverageZonesService } from './coverage-zones.service';
import { CoverageZonesController } from './coverage-zones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CoverageZone])],
  controllers: [CoverageZonesController],
  providers: [CoverageZonesService],
  exports: [TypeOrmModule, CoverageZonesService],
})
export class CoverageZonesModule {}
