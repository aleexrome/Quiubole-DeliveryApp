import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/user.entity';

@Controller('addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@Body() createAddressDto: CreateAddressDto, @CurrentUser() user: any) {
    return this.addressesService.create(createAddressDto, user.id);
  }

  @Get()
  @Roles(UserRole.CLIENT)
  findMyAddresses(@CurrentUser() user: any) {
    return this.addressesService.findByUser(user.id);
  }

  @Get('default')
  @Roles(UserRole.CLIENT)
  getDefault(@CurrentUser() user: any) {
    return this.addressesService.getDefault(user.id);
  }

  @Get(':id')
  @Roles(UserRole.CLIENT)
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.CLIENT)
  update(@Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto, @CurrentUser() user: any) {
    return this.addressesService.update(id, updateAddressDto, user.id);
  }

  @Patch(':id/set-default')
  @Roles(UserRole.CLIENT)
  setDefault(@Param('id') id: string, @CurrentUser() user: any) {
    return this.addressesService.setDefault(id, user.id);
  }

  @Delete(':id')
  @Roles(UserRole.CLIENT)
  remove(@Param('id') id: string) {
    return this.addressesService.remove(id);
  }
}
