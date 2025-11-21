import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from './payment-method.entity';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodsRepository: Repository<PaymentMethod>,
  ) {}

  async create(createPaymentMethodDto: CreatePaymentMethodDto, userId: string): Promise<PaymentMethod> {
    if (createPaymentMethodDto.isDefault) {
      await this.paymentMethodsRepository.update({ userId }, { isDefault: false });
    }

    const paymentMethod = this.paymentMethodsRepository.create({
      ...createPaymentMethodDto,
      userId,
    });
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async findByUser(userId: string): Promise<PaymentMethod[]> {
    return this.paymentMethodsRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<PaymentMethod> {
    const paymentMethod = await this.paymentMethodsRepository.findOne({ where: { id } });
    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }
    return paymentMethod;
  }

  async getDefault(userId: string): Promise<PaymentMethod | null> {
    return this.paymentMethodsRepository.findOne({
      where: { userId, isDefault: true },
    });
  }

  async setDefault(id: string, userId: string): Promise<PaymentMethod> {
    await this.paymentMethodsRepository.update({ userId }, { isDefault: false });
    const paymentMethod = await this.findOne(id);
    paymentMethod.isDefault = true;
    return this.paymentMethodsRepository.save(paymentMethod);
  }

  async remove(id: string): Promise<void> {
    const paymentMethod = await this.findOne(id);
    await this.paymentMethodsRepository.remove(paymentMethod);
  }
}
