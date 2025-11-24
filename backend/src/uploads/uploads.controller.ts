import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    return this.uploadsService.uploadFile(file, folder);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    return this.uploadsService.uploadMultiple(files, folder);
  }

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file, 'products');
  }

  @Post('restaurant-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRestaurantImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file, 'restaurants');
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file, 'profiles');
  }

  @Post('review-image')
  @UseInterceptors(FilesInterceptor('files', 5))
  async uploadReviewImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadsService.uploadMultiple(files, 'reviews');
  }

  @Delete(':path')
  async deleteFile(@Param('path') filePath: string) {
    return this.uploadsService.deleteFile(filePath);
  }
}
