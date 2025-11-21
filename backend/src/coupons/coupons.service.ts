import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull, Or } from 'typeorm';
import { Coupon, DiscountType } from './coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponsRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponsRepository.findOne({
      where: { code: createCouponDto.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    const coupon = this.couponsRepository.create({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
    });
    return this.couponsRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponsRepository.find({
      relations: ['restaurant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponsRepository.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException(`Coupon with code ${code} not found`);
    }
    return coupon;
  }

  async validateCoupon(code: string, orderTotal: number, restaurantId?: string): Promise<{ valid: boolean; discount: number; message?: string }> {
    const coupon = await this.findByCode(code);

    if (!coupon.isActive) {
      return { valid: false, discount: 0, message: 'Coupon is not active' };
    }

    const now = new Date();
    if (coupon.startDate && new Date(coupon.startDate) > now) {
      return { valid: false, discount: 0, message: 'Coupon is not yet valid' };
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < now) {
      return { valid: false, discount: 0, message: 'Coupon has expired' };
    }

    if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, discount: 0, message: 'Coupon usage limit reached' };
    }

    if (coupon.minimumOrder && orderTotal < Number(coupon.minimumOrder)) {
      return { valid: false, discount: 0, message: `Minimum order of $${coupon.minimumOrder} required` };
    }

    if (coupon.restaurantId && restaurantId && coupon.restaurantId !== restaurantId) {
      return { valid: false, discount: 0, message: 'Coupon not valid for this restaurant' };
    }

    let discount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discount = (orderTotal * Number(coupon.discountValue)) / 100;
    } else {
      discount = Number(coupon.discountValue);
    }

    if (coupon.maximumDiscount && discount > Number(coupon.maximumDiscount)) {
      discount = Number(coupon.maximumDiscount);
    }

    return { valid: true, discount };
  }

  async useCoupon(code: string): Promise<void> {
    const coupon = await this.findByCode(code);
    coupon.usageCount += 1;
    await this.couponsRepository.save(coupon);
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    if (updateCouponDto.code) {
      updateCouponDto.code = updateCouponDto.code.toUpperCase();
    }
    Object.assign(coupon, updateCouponDto);
    return this.couponsRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponsRepository.remove(coupon);
  }
}
