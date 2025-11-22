// ==========================================
// UPLOADS CONTROLLER
// ==========================================

import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from '@nestjs/common';

// DTOs
class UploadBase64Dto {
  base64: string;
  folder: 'products' | 'restaurants' | 'users' | 'drivers' | 'documents' | 'reviews';
}

class DeleteImageDto {
  publicId: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private uploadsService: UploadsService) {}

  // ==========================================
  // SUBIDA DE ARCHIVOS
  // ==========================================

  // Subir una imagen (multipart/form-data)
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }

    this.uploadsService.validateImageFile(file);

    const validFolders = ['products', 'restaurants', 'users', 'drivers', 'reviews'];
    if (!validFolders.includes(folder)) {
      throw new BadRequestException('Carpeta inválida');
    }

    return this.uploadsService.uploadImage(file, folder as any);
  }

  // Subir múltiples imágenes
  @Post('images')
  @UseInterceptors(FilesInterceptor('files', 5)) // Máximo 5 archivos
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No se enviaron archivos');
    }

    files.forEach((file) => this.uploadsService.validateImageFile(file));

    const validFolders = ['products', 'restaurants', 'reviews'];
    if (!validFolders.includes(folder)) {
      throw new BadRequestException('Carpeta inválida');
    }

    return this.uploadsService.uploadMultipleImages(files, folder as any);
  }

  // Subir imagen en base64
  @Post('image/base64')
  async uploadBase64Image(@Body() body: UploadBase64Dto) {
    if (!body.base64) {
      throw new BadRequestException('No se envió imagen base64');
    }

    // Validar que sea base64 válido
    const base64Regex = /^data:image\/(jpeg|jpg|png|webp|gif);base64,/;
    if (!base64Regex.test(body.base64)) {
      throw new BadRequestException('Formato base64 inválido');
    }

    return this.uploadsService.uploadImage(body.base64, body.folder);
  }

  // ==========================================
  // SUBIDA DE DOCUMENTOS (Repartidores)
  // ==========================================

  @Post('document/:type')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No se envió ningún archivo');
    }

    const validTypes = ['ine', 'license', 'insurance', 'vehicle'];
    if (!validTypes.includes(type)) {
      throw new BadRequestException('Tipo de documento inválido');
    }

    return this.uploadsService.uploadDocument(file, type as any, req.user.id);
  }

  // ==========================================
  // ELIMINACIÓN
  // ==========================================

  @Delete('image')
  async deleteImage(@Body() body: DeleteImageDto) {
    if (!body.publicId) {
      throw new BadRequestException('No se especificó el ID de la imagen');
    }

    const success = await this.uploadsService.deleteImage(body.publicId);

    return { success };
  }

  @Delete('images')
  async deleteMultipleImages(@Body('publicIds') publicIds: string[]) {
    if (!publicIds || publicIds.length === 0) {
      throw new BadRequestException('No se especificaron IDs de imágenes');
    }

    await this.uploadsService.deleteMultipleImages(publicIds);

    return { success: true, deleted: publicIds.length };
  }
}
