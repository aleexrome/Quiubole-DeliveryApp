import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';
import { RestaurantsService } from './restaurants.service';
import { EditorsService } from '../editors/editors.service';
import { AuditLogService } from '../editors/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { EditRateLimitGuard } from '../common/guards/edit-rate-limit.guard';

/**
 * DTO de edición — SOLO incluye campos que editor/dueño pueden modificar.
 * Campos prohibidos (isActive, isApproved, commissionRate, stripeAccountId,
 * ownerId, rating, totalReviews) quedan fuera a propósito — ValidationPipe
 * (whitelist=true) rechaza cualquier campo adicional que se mande.
 */
class UpdateRestaurantDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() logo?: string;
  @IsOptional() @IsString() coverImage?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsNumber() minimumOrder?: number;
  @IsOptional() @IsNumber() deliveryFee?: number;
  @IsOptional() @IsNumber() estimatedDeliveryTime?: number;
  @IsOptional() @IsObject() openingHours?: any;
}

@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly editorsService: EditorsService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Público: feed de restaurantes "Cerca de ti".
   *
   * Pasa `lat` + `lng` (GPS del cliente) para que solo aparezcan
   * restaurantes que físicamente pueden entregarle (distance ≤
   * deliveryRadiusKm de cada restaurante). Ordenados por distancia.
   *
   * Si NO hay GPS, usa `zone` como fallback de marketing/label.
   *
   * Si tampoco hay zone, devuelve todos los activos.
   */
  @Public()
  @Get()
  async findAll(
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('zone') zone?: string,
  ) {
    if (lat && lng) {
      return this.restaurantsService.findForCustomerFeed({
        latitude: Number(lat),
        longitude: Number(lng),
        zone,
      });
    }
    if (zone) {
      return this.restaurantsService.findForCustomerFeed({ zone });
    }
    return this.restaurantsService.findAll();
  }

  /**
   * Restaurant del owner autenticado. Devuelve null si aún no creó uno.
   * IMPORTANTE: esta ruta DEBE ir antes de `:id` para que Nest no la
   * matchee como findOne con id="my-restaurant" (Postgres rechazaría
   * "my-restaurant" como UUID y daría 500).
   */
  @Get('my-restaurant')
  @UseGuards(JwtAuthGuard)
  async myRestaurant(@CurrentUser() user: any) {
    return this.restaurantsService.findMyRestaurant(user.id);
  }

  /** Stats del restaurant del owner. Período: day/week/month. */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async stats(
    @CurrentUser() user: any,
    @Query('period') period: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.restaurantsService.getStats(user.id, period);
  }

  /**
   * Toggle abrir/cerrar negocio del owner autenticado. Es el botón
   * grande del Dashboard del restaurant — abre/cierra temporalmente
   * para recibir pedidos (no requiere aprobación de admin).
   *
   * Importante: usa el restaurant del owner, no `:id`. Esta ruta debe
   * ir ANTES de `:id` para evitar que Nest interprete "my" como UUID.
   */
  @Patch('my/open')
  @UseGuards(JwtAuthGuard)
  async setOpen(
    @CurrentUser() user: any,
    @Body() body: { isOpen: boolean },
  ) {
    return this.restaurantsService.setOpenForOwner(user.id, !!body?.isOpen);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  /**
   * Edita datos del restaurante. Dueño, editor asignado o admin.
   * Los campos sensibles (isActive, commissionRate, etc.) no están en el DTO,
   * así que el ValidationPipe global los rechaza automáticamente.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, EditRateLimitGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @CurrentUser() user: any,
  ) {
    const allowed = await this.editorsService.canUserEditRestaurant(
      user.id,
      user.role as UserRole,
      id,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'No tienes permiso para editar este restaurante',
      );
    }

    const before = await this.restaurantsService.findOne(id);
    const updated = await this.restaurantsService.update(id, dto);

    const diff = AuditLogService.diff(before as any, dto as any);
    await this.auditLog.log({
      userId: user.id,
      action: 'restaurant_updated',
      restaurantId: id,
      changes: diff,
    });

    // Si el actor es editor, avisar al dueño con el detalle.
    if (user.role === UserRole.EDITOR && before.ownerId) {
      const fields = Object.keys(diff.after);
      if (fields.length > 0) {
        await this.notifications.sendPushNotification(
          before.ownerId,
          `Cambios en ${before.name}`,
          `Un editor actualizó: ${fields.join(', ')}.`,
          {
            type: 'editor_restaurant_updated',
            restaurantId: id,
            actorId: user.id,
          },
        );
      }
    }

    return updated;
  }
}
