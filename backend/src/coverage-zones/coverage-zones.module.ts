import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoverageZonesService } from './coverage-zones.service';
import { CoverageZonesController } from './coverage-zones.controller';
import { CoverageZone } from './coverage-zone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoverageZone])],
  controllers: [CoverageZonesController],
  providers: [CoverageZonesService],
  exports: [CoverageZonesService],
})
export class CoverageZonesModule {}
