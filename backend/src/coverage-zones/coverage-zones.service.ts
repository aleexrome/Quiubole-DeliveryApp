import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoverageZone } from './coverage-zone.entity';
import { CreateCoverageZoneDto } from './dto/create-coverage-zone.dto';
import { UpdateCoverageZoneDto } from './dto/update-coverage-zone.dto';

@Injectable()
export class CoverageZonesService {
  constructor(
    @InjectRepository(CoverageZone)
    private coverageZonesRepository: Repository<CoverageZone>,
  ) {}

  async create(createCoverageZoneDto: CreateCoverageZoneDto): Promise<CoverageZone> {
    const zone = this.coverageZonesRepository.create(createCoverageZoneDto);
    return this.coverageZonesRepository.save(zone);
  }

  async findAll(): Promise<CoverageZone[]> {
    return this.coverageZonesRepository.find({
      relations: ['restaurant'],
      where: { isActive: true },
    });
  }

  async findByRestaurant(restaurantId: string): Promise<CoverageZone[]> {
    return this.coverageZonesRepository.find({
      where: { restaurantId, isActive: true },
    });
  }

  async findOne(id: string): Promise<CoverageZone> {
    const zone = await this.coverageZonesRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });
    if (!zone) {
      throw new NotFoundException(`Coverage zone with ID ${id} not found`);
    }
    return zone;
  }

  async checkCoverage(latitude: number, longitude: number, restaurantId?: string): Promise<{
    inCoverage: boolean;
    zones: CoverageZone[];
    extraFee: number;
  }> {
    let query = this.coverageZonesRepository.createQueryBuilder('zone');
    query.where('zone.isActive = :isActive', { isActive: true });

    if (restaurantId) {
      query.andWhere('zone.restaurantId = :restaurantId', { restaurantId });
    }

    const zones = await query.getMany();
    const matchingZones: CoverageZone[] = [];
    let minExtraFee = 0;

    for (const zone of zones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        Number(zone.centerLatitude),
        Number(zone.centerLongitude),
      );

      if (distance <= Number(zone.radiusKm)) {
        matchingZones.push(zone);
        if (Number(zone.extraDeliveryFee) > minExtraFee) {
          minExtraFee = Number(zone.extraDeliveryFee);
        }
      }
    }

    return {
      inCoverage: matchingZones.length > 0,
      zones: matchingZones,
      extraFee: minExtraFee,
    };
  }

  async findRestaurantsInRange(latitude: number, longitude: number, radiusKm: number = 10): Promise<string[]> {
    const zones = await this.coverageZonesRepository.find({ where: { isActive: true } });
    const restaurantIds = new Set<string>();

    for (const zone of zones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        Number(zone.centerLatitude),
        Number(zone.centerLongitude),
      );

      if (distance <= radiusKm || distance <= Number(zone.radiusKm)) {
        restaurantIds.add(zone.restaurantId);
      }
    }

    return Array.from(restaurantIds);
  }

  async update(id: string, updateCoverageZoneDto: UpdateCoverageZoneDto): Promise<CoverageZone> {
    const zone = await this.findOne(id);
    Object.assign(zone, updateCoverageZoneDto);
    return this.coverageZonesRepository.save(zone);
  }

  async remove(id: string): Promise<void> {
    const zone = await this.findOne(id);
    await this.coverageZonesRepository.remove(zone);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
