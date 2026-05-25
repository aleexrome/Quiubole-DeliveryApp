// ==========================================
// CoverageZonesService
//
// Catálogo de municipios/zonas donde Devolón opera. Por ahora MVP con
// una sola zona activa (Tenancingo) — el flujo está hecho para
// escalar a más zonas sin tocar frontend: admin agrega filas a la
// tabla coverage_zones, y el dropdown del registro las muestra.
//
// onModuleInit hace seed idempotente de Tenancingo si no existe.
// ==========================================

import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoverageZone } from './coverage-zone.entity';

@Injectable()
export class CoverageZonesService implements OnModuleInit {
  constructor(
    @InjectRepository(CoverageZone)
    private readonly repo: Repository<CoverageZone>,
  ) {}

  /** Seed automático al arrancar — idempotente. */
  async onModuleInit() {
    try {
      const tenancingo = await this.repo.findOne({
        where: { name: 'Tenancingo' },
      });
      if (!tenancingo) {
        await this.repo.save(
          this.repo.create({
            name: 'Tenancingo',
            description: 'Tenancingo de Degollado, Estado de México',
            // Centro aproximado de Tenancingo (consultable en mapas).
            centerLatitude: 18.9606,
            centerLongitude: -99.5908,
            radiusKm: 10,
            isActive: true,
            baseDeliveryFee: 25,
            perKmFee: 5,
          }),
        );
      }
    } catch (e) {
      // No bloqueamos el arranque del módulo si falla el seed.
      // eslint-disable-next-line no-console
      console.error('Coverage zones seed failed:', e);
    }
  }

  /** Lista de zonas activas — uso público para el dropdown del registro. */
  async listActive(): Promise<CoverageZone[]> {
    return this.repo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /** Lista de todas las zonas — uso admin. */
  async listAll(): Promise<CoverageZone[]> {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async findById(id: string): Promise<CoverageZone> {
    const zone = await this.repo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    return zone;
  }

  async findByName(name: string): Promise<CoverageZone | null> {
    return this.repo.findOne({ where: { name } });
  }

  /** Admin crea zona nueva. */
  async create(data: Partial<CoverageZone>): Promise<CoverageZone> {
    const zone = this.repo.create(data);
    return this.repo.save(zone);
  }

  /** Admin actualiza zona (toggle activa, ajustar radio/fees, etc.). */
  async update(
    id: string,
    data: Partial<CoverageZone>,
  ): Promise<CoverageZone> {
    await this.repo.update(id, data);
    return this.findById(id);
  }
}
