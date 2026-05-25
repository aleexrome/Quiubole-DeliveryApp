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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EditRateLimitGuard } from '../common/guards/edit-rate-limit.guard';

// Tamaño máximo por archivo: 5MB. Multer cierra el stream automáticamente
// al superar el límite y lanza un 413 antes de llegar al handler.
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Solo imágenes — filtra por MIME type en vez de extensión para evitar spoofing.
const imageFileFilter = (
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/i.test(file.mimetype)) {
    return cb(
      new BadRequestException(
        'Solo se permiten imágenes (JPEG, PNG, WebP, GIF, HEIC).',
      ),
      false,
    );
  }
  cb(null, true);
};

const imageUploadOptions = {
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
};

@Controller('uploads')
@UseGuards(JwtAuthGuard, EditRateLimitGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    return this.uploadsService.uploadFile(file, folder);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, imageUploadOptions))
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    return this.uploadsService.uploadMultiple(files, folder);
  }

  @Post('product-image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadProductImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file, 'products');
  }

  @Post('restaurant-image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadRestaurantImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file, 'restaurants');
  }

  @Post('profile-image')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    return this.uploadsService.uploadFile(file, 'profiles');
  }

  @Post('review-image')
  @UseInterceptors(FilesInterceptor('files', 5, imageUploadOptions))
  async uploadReviewImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadsService.uploadMultiple(files, 'reviews');
  }

  @Delete(':path')
  async deleteFile(@Param('path') filePath: string) {
    return this.uploadsService.deleteFile(filePath);
  }
}
