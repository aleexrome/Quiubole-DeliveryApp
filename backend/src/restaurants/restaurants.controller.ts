import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { SearchRestaurantDto } from './dto/search-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { UserRole } from '../users/user.entity';

@Controller('restaurants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  create(@Body() createRestaurantDto: CreateRestaurantDto, @CurrentUser() user: any) {
    return this.restaurantsService.create(createRestaurantDto, user.id);
  }

  @Public()
  @Get()
  findAll() {
    return this.restaurantsService.findAll();
  }

  @Public()
  @Get('search')
  search(@Query() searchDto: SearchRestaurantDto) {
    return this.restaurantsService.search(searchDto);
  }

  @Get('my-restaurants')
  @Roles(UserRole.RESTAURANT)
  findMyRestaurants(@CurrentUser() user: any) {
    return this.restaurantsService.findByOwner(user.id);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.RESTAURANT, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, updateRestaurantDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.restaurantsService.remove(id);
  }
}
