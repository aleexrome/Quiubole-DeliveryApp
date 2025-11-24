import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoverageZone } from './coverage-zone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoverageZone])],
  exports: [TypeOrmModule],
})
export class CoverageZonesModule {}
