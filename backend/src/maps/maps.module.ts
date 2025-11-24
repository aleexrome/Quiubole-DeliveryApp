import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';
import { CoverageZone } from '../coverage-zones/coverage-zone.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([CoverageZone])],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
