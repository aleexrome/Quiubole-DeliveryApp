import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(UserRole.ADMIN)
  getAdminStats() {
    return this.dashboardService.getAdminStats();
  }

  @Get('restaurant/:restaurantId')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  getRestaurantStats(@Param('restaurantId') restaurantId: string) {
    return this.dashboardService.getRestaurantStats(restaurantId);
  }

  @Get('driver')
  @Roles(UserRole.DRIVER)
  getDriverStats(@CurrentUser() user: any) {
    return this.dashboardService.getDriverStats(user.id);
  }
}
