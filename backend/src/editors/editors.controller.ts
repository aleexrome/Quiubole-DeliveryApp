import { Controller, Get, UseGuards } from '@nestjs/common';
import { EditorsService } from './editors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';

/**
 * Endpoints consumidos por el editor autenticado desde la app móvil.
 */
@Controller('editors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EDITOR)
export class EditorsController {
  constructor(private readonly editorsService: EditorsService) {}

  /**
   * Lista de restaurantes que este editor puede editar.
   * El frontend la usa para armar el selector de restaurantes en EditorTabs.
   */
  @Get('me/restaurants')
  async getMyRestaurants(@CurrentUser('id') userId: string) {
    return this.editorsService.getMyRestaurants(userId);
  }
}
