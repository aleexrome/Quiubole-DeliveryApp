// ==========================================
// AddressesService
//
// CRUD de direcciones guardadas del cliente. Una dirección puede estar
// marcada como default (la que se usa por defecto al hacer checkout).
// El frontend permite autocompletar via reverse-geocode del GPS + edición
// manual de cualquier campo.
// ==========================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly repo: Repository<Address>,
  ) {}

  async listMine(userId: string): Promise<Address[]> {
    return this.repo.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Address> {
    const addr = await this.repo.findOne({ where: { id } });
    if (!addr) throw new NotFoundException('Dirección no encontrada');
    if (addr.userId !== userId) {
      throw new ForbiddenException('Esta dirección no es tuya');
    }
    return addr;
  }

  async create(
    userId: string,
    data: Partial<Address>,
  ): Promise<Address> {
    if (!data.street?.trim()) {
      throw new BadRequestException('La calle es requerida');
    }
    if (
      typeof data.latitude !== 'number' ||
      typeof data.longitude !== 'number'
    ) {
      throw new BadRequestException(
        'Necesitamos lat/lng (usa el botón de "Usar mi ubicación")',
      );
    }

    // Si pide ser default, primero unmarcamos cualquier otra default.
    if (data.isDefault) {
      await this.repo.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    } else {
      // Si es la primera dirección del usuario, la marcamos default auto.
      const count = await this.repo.count({ where: { userId } });
      if (count === 0) {
        data.isDefault = true;
      }
    }

    const addr = this.repo.create({ ...data, userId });
    return this.repo.save(addr);
  }

  async update(
    id: string,
    userId: string,
    data: Partial<Address>,
  ): Promise<Address> {
    const existing = await this.findOne(id, userId);

    if (data.isDefault && !existing.isDefault) {
      await this.repo.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    await this.repo.update(id, data);
    return this.findOne(id, userId);
  }

  async remove(id: string, userId: string): Promise<{ removedDefault: boolean }> {
    const existing = await this.findOne(id, userId);
    await this.repo.delete(id);

    // Si la borrada era default, promovemos la más reciente a default.
    if (existing.isDefault) {
      const next = await this.repo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      if (next) {
        await this.repo.update(next.id, { isDefault: true });
      }
    }
    return { removedDefault: existing.isDefault };
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    await this.findOne(id, userId); // valida ownership
    await this.repo.update(
      { userId, isDefault: true },
      { isDefault: false },
    );
    await this.repo.update(id, { isDefault: true });
    return this.findOne(id, userId);
  }
}
