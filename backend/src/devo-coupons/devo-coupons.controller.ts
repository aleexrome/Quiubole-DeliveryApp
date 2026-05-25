// ==========================================
// DevoCouponsController — endpoints REST
//
//   GET    /devo-coupons/my                   — mis cupones + balance pts
//   GET    /devo-coupons/admin/pending        — admin: cupones por asignar
//   POST   /devo-coupons/:id/assign           — admin: configura el cupón
//   POST   /devo-coupons/:id/preview          — preview de descuento
// ==========================================

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsUUID,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { DevoCouponsService } from './devo-coupons.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { UserCouponType } from './user-coupon.entity';

class AssignCouponDto {
  @IsIn(['percentage', 'fixed', 'free_delivery', 'product_discount'])
  type: UserCouponType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

class PreviewDto {
  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @IsUUID()
  restaurantId: string;

  @IsOptional()
  productIds?: string[];
}

@Controller('devo-coupons')
@UseGuards(JwtAuthGuard)
export class DevoCouponsController {
  constructor(private readonly service: DevoCouponsService) {}

  @Get('my')
  async listMine(@Request() req: any) {
    return this.service.listMine(req.user.id);
  }

  @Get('admin/pending')
  async listPendingForAdmin(@Request() req: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo admin');
    }
    return this.service.listPendingForAdmin();
  }

  @Post(':id/assign')
  async assign(
    @Param('id') id: string,
    @Body() dto: AssignCouponDto,
    @Request() req: any,
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Solo admin puede asignar cupones');
    }
    return this.service.assignCoupon(id, req.user.id, dto);
  }

  @Post(':id/preview')
  async preview(
    @Param('id') id: string,
    @Body() dto: PreviewDto,
    @Request() req: any,
  ) {
    return this.service.previewDiscount(
      id,
      req.user.id,
      dto.subtotal,
      dto.deliveryFee,
      dto.restaurantId,
      dto.productIds || [],
    );
  }
}
