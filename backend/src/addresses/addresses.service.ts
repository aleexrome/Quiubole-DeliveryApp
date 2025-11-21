import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from './address.entity';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private addressesRepository: Repository<Address>,
  ) {}

  async create(createAddressDto: CreateAddressDto, userId: string): Promise<Address> {
    if (createAddressDto.isDefault) {
      await this.addressesRepository.update({ userId }, { isDefault: false });
    }

    const address = this.addressesRepository.create({
      ...createAddressDto,
      userId,
    });
    return this.addressesRepository.save(address);
  }

  async findByUser(userId: string): Promise<Address[]> {
    return this.addressesRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Address> {
    const address = await this.addressesRepository.findOne({ where: { id } });
    if (!address) {
      throw new NotFoundException(`Address with ID ${id} not found`);
    }
    return address;
  }

  async getDefault(userId: string): Promise<Address | null> {
    return this.addressesRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async update(id: string, updateAddressDto: UpdateAddressDto, userId: string): Promise<Address> {
    const address = await this.findOne(id);

    if (updateAddressDto.isDefault) {
      await this.addressesRepository.update({ userId }, { isDefault: false });
    }

    Object.assign(address, updateAddressDto);
    return this.addressesRepository.save(address);
  }

  async setDefault(id: string, userId: string): Promise<Address> {
    await this.addressesRepository.update({ userId }, { isDefault: false });
    const address = await this.findOne(id);
    address.isDefault = true;
    return this.addressesRepository.save(address);
  }

  async remove(id: string): Promise<void> {
    const address = await this.findOne(id);
    await this.addressesRepository.remove(address);
  }
}
