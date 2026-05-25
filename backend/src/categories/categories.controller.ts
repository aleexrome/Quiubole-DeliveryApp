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
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  MinLength,
} from 'class-validator';
import { CategoriesService } from './categories.service';
import { EditorsService } from '../editors/editors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

class CreateCategoryDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  // Si se envía restaurantId → categoría propia de un restaurante.
  // Si es null/omitido → categoría global (solo admin puede crearla).
  @IsOptional() @IsUUID() restaurantId?: string;
}

class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsNumber() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly editorsService: EditorsService,
  ) {}

  /** Público: categorías globales (definidas por admin). */
  @Public()
  @Get()
  async findAll(@Query('restaurantId') restaurantId?: string) {
    if (restaurantId) {
      return this.categoriesService.findByRestaurant(restaurantId);
    }
    return this.categoriesService.findAllGlobal();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  /**
   * Crear categoría.
   * - Si no se envía restaurantId → global (solo admin)
   * - Si se envía restaurantId → propia del restaurante (dueño, editor o admin)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateCategoryDto, @CurrentUser() user: any) {
    if (dto.restaurantId) {
      const allowed = await this.editorsService.canUserEditRestaurant(
        user.id,
        user.role as UserRole,
        dto.restaurantId,
      );
      if (!allowed) {
        throw new ForbiddenException(
          'No tienes permiso para crear categorías en este restaurante',
        );
      }
    } else {
      // Global → solo admin
      if (user.role !== UserRole.ADMIN) {
        throw new ForbiddenException(
          'Solo el admin puede crear categorías globales',
        );
      }
    }
    return this.categoriesService.create(dto);
  }

  /** Editar categoría — mismas reglas que crear. */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: any,
  ) {
    const cat = await this.categoriesService.findOne(id);
    if (cat.restaurantId) {
      const allowed = await this.editorsService.canUserEditRestaurant(
        user.id,
        user.role as UserRole,
        cat.restaurantId,
      );
      if (!allowed) {
        throw new ForbiddenException(
          'No tienes permiso para editar esta categoría',
        );
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo el admin puede editar categorías globales',
      );
    }
    return this.categoriesService.update(id, dto);
  }

  /** Borrar — solo admin para globales, dueño/editor para las de restaurante. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RESTAURANT, UserRole.EDITOR, UserRole.MERCHANT)
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const cat = await this.categoriesService.findOne(id);
    if (cat.restaurantId) {
      const allowed = await this.editorsService.canUserEditRestaurant(
        user.id,
        user.role as UserRole,
        cat.restaurantId,
      );
      if (!allowed) {
        throw new ForbiddenException(
          'No tienes permiso para eliminar esta categoría',
        );
      }
    } else if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Solo el admin puede eliminar categorías globales',
      );
    }
    return this.categoriesService.remove(id);
  }
}
