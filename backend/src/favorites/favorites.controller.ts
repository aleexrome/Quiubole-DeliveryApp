import { Controller, Get, Post, Delete, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':restaurantId')
  @Roles(UserRole.CLIENT)
  add(@Param('restaurantId') restaurantId: string, @CurrentUser() user: any) {
    return this.favoritesService.add(user.id, restaurantId);
  }

  @Get()
  @Roles(UserRole.CLIENT)
  findMyFavorites(@CurrentUser() user: any) {
    return this.favoritesService.findByUser(user.id);
  }

  @Get('check/:restaurantId')
  @Roles(UserRole.CLIENT)
  checkFavorite(@Param('restaurantId') restaurantId: string, @CurrentUser() user: any) {
    return this.favoritesService.isFavorite(user.id, restaurantId);
  }

  @Delete(':restaurantId')
  @Roles(UserRole.CLIENT)
  remove(@Param('restaurantId') restaurantId: string, @CurrentUser() user: any) {
    return this.favoritesService.remove(user.id, restaurantId);
  }
}
