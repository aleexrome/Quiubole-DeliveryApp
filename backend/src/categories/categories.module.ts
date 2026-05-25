import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { EditorsModule } from '../editors/editors.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    forwardRef(() => EditorsModule),
  ],
  providers: [CategoriesService],
  controllers: [CategoriesController],
  exports: [CategoriesService, TypeOrmModule],
})
export class CategoriesModule {}
