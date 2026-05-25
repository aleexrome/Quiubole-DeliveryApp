import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EditorsService } from './editors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

/**
 * Endpoints de gestión de editores, reservados al admin (B2).
 * Prefix: /api/admin/editors
 */
@Controller('admin/editors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminEditorsController {
  constructor(private readonly editorsService: EditorsService) {}

  /** Lista todos los editores con sus restaurantes asignados. */
  @Get()
  async listAll() {
    return this.editorsService.listAllEditors();
  }

  /** Promueve un usuario existente (cualquier rol) a editor. */
  @Post(':userId')
  async promote(@Param('userId') userId: string) {
    return this.editorsService.promoteToEditor(userId);
  }

  /** Degrada un editor a client y limpia sus asignaciones. */
  @Delete(':userId')
  async demote(@Param('userId') userId: string) {
    return this.editorsService.demoteEditor(userId);
  }

  /**
   * Asigna uno o varios restaurantes al editor.
   * Body: { restaurantIds: string[] }
   */
  @Post(':userId/restaurants')
  async assignRestaurants(
    @Param('userId') userId: string,
    @Body() body: { restaurantIds: string[] },
  ) {
    return this.editorsService.assignRestaurants(userId, body.restaurantIds);
  }

  /** Remueve un restaurante específico del editor. */
  @Delete(':userId/restaurants/:restaurantId')
  async unassignRestaurant(
    @Param('userId') userId: string,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.editorsService.unassignRestaurant(userId, restaurantId);
  }
}
