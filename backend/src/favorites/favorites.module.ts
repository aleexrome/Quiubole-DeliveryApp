import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Favorite])],
  exports: [TypeOrmModule],
})
export class FavoritesModule {}
