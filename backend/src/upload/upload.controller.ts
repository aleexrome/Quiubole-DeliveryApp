import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Param, Delete, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post(':folder')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: any, @Param('folder') folder: string) {
    const result = await this.uploadService.uploadImage(file, folder);
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  }

  @Delete()
  async deleteImage(@Body('publicId') publicId: string) {
    return this.uploadService.deleteImage(publicId);
  }
}
