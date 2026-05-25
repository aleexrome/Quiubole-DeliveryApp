import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  MinLength,
  Min,
} from 'class-validator';
import { ProductsService } from './products.service';
import { EditorsService } from '../editors/editors.service';
import { AuditLogService } from '../editors/audit-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { EditRateLimitGuard } from '../common/guards/edit-rate-limit.guard';

class CreateProductDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsNumber() @Min(0) comparePrice?: number;
  @IsOptional() @IsString() image?: string;
  @IsUUID() restaurantId: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsNumber() @Min(0) preparationTime?: number;
}

class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) comparePrice?: number;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsBoolean() isAvailable?: boolean;
  @IsOptional() @IsNumber() @Min(0) preparationTime?: number;
  @IsOptional() @IsNumber() @Min(0) sortOrder?: number;
}

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly editorsService: EditorsService,
    private readonly auditLog: AuditLogService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Público: lista productos activos APROBADOS o filtra por restaurante.
   * Los productos en revisión NO aparecen — para verlos como editor o
   * admin usar GET /products/managed/by-restaurant (auth requerido).
   */
  @Public()
  @Get()
  async findAll(@Query('restaurantId') restaurantId?: string) {
    if (restaurantId) {
      return this.productsService.findByRestaurant(restaurantId);
    }
    return this.productsService.findAll();
  }

  /**
   * Lista productos del restaurante INCLUYENDO los pendientes de aprobación.
   * Solo accesible para editor asignado a ese restaurant o admin.
   * Usado por la pantalla EditorMenuScreen.
   */
  @Get('managed/by-restaurant')
  @UseGuards(JwtAuthGuard)
  async findManagedByRestaurant(
    @Query('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    if (!restaurantId) {
      throw new ForbiddenException('restaurantId es requerido');
    }
    await this.assertCanEditRestaurant(user, restaurantId);
    return this.productsService.findByRestaurant(restaurantId, {
      includePending: true,
    });
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  /**
   * Crear producto. SOLO editor o admin.
   *
   * El dueño del restaurante (role 'restaurant' / 'merchant') NO crea
   * productos en este modelo de negocio: lo hace su editor asignado.
   * El producto recién creado queda con `isApproved=false` y se manda
   * a revisión de admin antes de aparecer en el menú del restaurant.
   */
  @Post()
  @UseGuards(JwtAuthGuard, EditRateLimitGuard)
  async create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    if (
      user.role === UserRole.RESTAURANT ||
      user.role === UserRole.MERCHANT
    ) {
      throw new ForbiddenException(
        'Los dueños no crean productos directamente. Pídele a tu editor que lo agregue.',
      );
    }
    await this.assertCanEditRestaurant(user, dto.restaurantId);
    // Editor crea como pending; admin auto-aprueba sus creaciones.
    const created = await this.productsService.create({
      ...dto,
      isApproved: user.role === UserRole.ADMIN,
    } as any);
    // Recarga con relación restaurant para obtener ownerId en la notificación.
    const createdWithRel = await this.productsService.findOne(created.id);

    await this.auditLog.log({
      userId: user.id,
      action: 'product_created',
      restaurantId: dto.restaurantId,
      productId: created.id,
      changes: { after: { name: created.name, price: created.price } },
    });
    await this.notifyOwnerIfEditor(
      user,
      createdWithRel.restaurant?.ownerId,
      dto.restaurantId,
      {
        title: 'Nuevo producto',
        body: `Un editor agregó "${created.name}" a tu menú.`,
        type: 'editor_product_created',
      },
    );

    return created;
  }

  /**
   * Editar producto.
   *
   * Roles:
   *  - restaurant owner: SOLO puede tocar `isAvailable` (activar/desactivar
   *    su carta del día). Cualquier otro campo → 403.
   *  - editor: puede editar todo, pero cualquier cambio resetea
   *    `isApproved=false` (vuelve a revisión de admin).
   *  - admin: puede editar todo sin reset de approval.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, EditRateLimitGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: any,
  ) {
    const before = await this.productsService.findOne(id);
    await this.assertCanEditRestaurant(user, before.restaurantId);

    const isOwner =
      user.role === UserRole.RESTAURANT || user.role === UserRole.MERCHANT;
    const isEditor = user.role === UserRole.EDITOR;

    if (isOwner) {
      // Whitelist estricto para owners: solo `isAvailable`.
      const requestedFields = Object.keys(dto);
      const forbidden = requestedFields.filter((f) => f !== 'isAvailable');
      if (forbidden.length > 0) {
        throw new ForbiddenException(
          `Como dueño solo puedes cambiar disponibilidad. Para editar ${forbidden.join(', ')} contacta a tu editor.`,
        );
      }
    }

    // Si el editor edita algo, el producto vuelve a revisión.
    const finalDto: any = { ...dto };
    if (isEditor) {
      finalDto.isApproved = false;
    }

    const after = await this.productsService.update(id, finalDto);

    const diff = AuditLogService.diff(before as any, dto as any);
    await this.auditLog.log({
      userId: user.id,
      action: 'product_updated',
      restaurantId: before.restaurantId,
      productId: id,
      changes: diff,
    });

    // Notificar al dueño solo cuando cambia algo crítico (precio o disponibilidad).
    const priceChanged = diff.after.price !== undefined;
    const availabilityChanged = diff.after.isAvailable !== undefined;
    if (priceChanged || availabilityChanged) {
      const partes: string[] = [];
      if (priceChanged) {
        partes.push(`precio: $${diff.before.price} → $${diff.after.price}`);
      }
      if (availabilityChanged) {
        partes.push(diff.after.isAvailable ? 'disponible' : 'no disponible');
      }
      await this.notifyOwnerIfEditor(
        user,
        before.restaurant?.ownerId,
        before.restaurantId,
        {
          title: `Cambio en "${before.name}"`,
          body: `Un editor actualizó ${partes.join(' · ')}.`,
          type: 'editor_product_updated',
        },
      );
    }

    return after;
  }

  /** Borrar producto — editor o admin. Owners NO eliminan. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, EditRateLimitGuard)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    if (
      user.role === UserRole.RESTAURANT ||
      user.role === UserRole.MERCHANT
    ) {
      throw new ForbiddenException(
        'Los dueños no eliminan productos. Pídele a tu editor que lo retire del menú.',
      );
    }
    const product = await this.productsService.findOne(id);
    await this.assertCanEditRestaurant(user, product.restaurantId);
    const result = await this.productsService.remove(id);

    await this.auditLog.log({
      userId: user.id,
      action: 'product_deleted',
      restaurantId: product.restaurantId,
      productId: id,
      changes: {
        before: { name: product.name, price: product.price },
        softDeleted: result.softDeleted,
      },
    });
    await this.notifyOwnerIfEditor(
      user,
      product.restaurant?.ownerId,
      product.restaurantId,
      {
        title: 'Producto eliminado',
        body: `Un editor eliminó "${product.name}" del menú.`,
        type: 'editor_product_deleted',
      },
    );

    return result;
  }

  // ----- helpers -----
  private async assertCanEditRestaurant(user: any, restaurantId: string) {
    if (!restaurantId) {
      throw new BadRequestException('restaurantId es requerido');
    }
    const allowed = await this.editorsService.canUserEditRestaurant(
      user.id,
      user.role as UserRole,
      restaurantId,
    );
    if (!allowed) {
      throw new ForbiddenException(
        'No tienes permiso para editar productos de este restaurante',
      );
    }
  }

  /**
   * Envía push al dueño del restaurante SOLO cuando la acción la hizo un
   * editor (no el propio dueño ni admin). Silencioso si no hay ownerId.
   */
  private async notifyOwnerIfEditor(
    actor: any,
    ownerId: string | undefined | null,
    restaurantId: string,
    payload: { title: string; body: string; type: string },
  ) {
    if (actor.role !== UserRole.EDITOR) return;
    if (!ownerId) return;
    await this.notifications.sendPushNotification(
      ownerId,
      payload.title,
      payload.body,
      { type: payload.type, restaurantId, actorId: actor.id },
    );
  }
}
