// ==========================================
// UPLOADS SERVICE - Cloudinary Integration
// ==========================================

import { Injectable, Logger, OnModuleInit, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Tipos
interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

interface UploadOptions {
  folder?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'fit' | 'scale' | 'thumb';
    quality?: 'auto' | number;
  };
  resourceType?: 'image' | 'video' | 'raw';
}

type ImageFolder = 'products' | 'restaurants' | 'users' | 'drivers' | 'documents' | 'reviews';

@Injectable()
export class UploadsService implements OnModuleInit {
  private readonly logger = new Logger(UploadsService.name);
  private isConfigured = false;

  onModuleInit() {
    this.initializeCloudinary();
  }

  private initializeCloudinary() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn('Cloudinary not configured - uploads will be simulated');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isConfigured = true;
    this.logger.log('Cloudinary initialized successfully');
  }

  // ==========================================
  // SUBIDA DE IMÁGENES
  // ==========================================

  async uploadImage(
    file: Express.Multer.File | string, // Buffer o base64
    folder: ImageFolder,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return this.simulateUpload(folder);
    }

    try {
      const uploadOptions: any = {
        folder: `quiubole/${folder}`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        max_bytes: 10 * 1024 * 1024, // 10MB
      };

      // Aplicar transformaciones según el tipo de imagen
      uploadOptions.transformation = this.getTransformations(folder, options?.transformation);

      let result: UploadApiResponse;

      if (typeof file === 'string') {
        // Base64 string
        result = await cloudinary.uploader.upload(file, uploadOptions);
      } else {
        // Buffer (Multer file)
        result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) reject(error);
              else resolve(result!);
            },
          );
          uploadStream.end(file.buffer);
        });
      }

      this.logger.log(`Image uploaded: ${result.public_id}`);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error('Error uploading image:', error);
      throw new BadRequestException('Error al subir la imagen');
    }
  }

  async uploadMultipleImages(
    files: (Express.Multer.File | string)[],
    folder: ImageFolder,
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  // ==========================================
  // ELIMINACIÓN DE IMÁGENES
  // ==========================================

  async deleteImage(publicId: string): Promise<boolean> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Delete image: ${publicId}`);
      return true;
    }

    try {
      await cloudinary.uploader.destroy(publicId);
      this.logger.log(`Image deleted: ${publicId}`);
      return true;
    } catch (error) {
      this.logger.error('Error deleting image:', error);
      return false;
    }
  }

  async deleteMultipleImages(publicIds: string[]): Promise<void> {
    if (!this.isConfigured) {
      this.logger.log(`[SIMULATED] Delete images: ${publicIds.join(', ')}`);
      return;
    }

    try {
      await cloudinary.api.delete_resources(publicIds);
      this.logger.log(`Deleted ${publicIds.length} images`);
    } catch (error) {
      this.logger.error('Error deleting images:', error);
    }
  }

  // ==========================================
  // TRANSFORMACIONES DE IMÁGENES
  // ==========================================

  getOptimizedUrl(publicId: string, options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  }): string {
    if (!this.isConfigured) {
      return `https://placeholder.com/${options?.width || 400}x${options?.height || 400}`;
    }

    return cloudinary.url(publicId, {
      transformation: [
        {
          width: options?.width,
          height: options?.height,
          crop: options?.crop || 'fill',
          quality: options?.quality || 'auto',
          fetch_format: 'auto',
        },
      ],
    });
  }

  getThumbnailUrl(publicId: string, size: number = 150): string {
    return this.getOptimizedUrl(publicId, {
      width: size,
      height: size,
      crop: 'thumb',
      quality: 'auto',
    });
  }

  // ==========================================
  // SUBIDA DE DOCUMENTOS (para repartidores)
  // ==========================================

  async uploadDocument(
    file: Express.Multer.File | string,
    documentType: 'ine' | 'license' | 'insurance' | 'vehicle',
    userId: string,
  ): Promise<UploadResult> {
    if (!this.isConfigured) {
      return this.simulateUpload('documents');
    }

    try {
      const result = await cloudinary.uploader.upload(
        typeof file === 'string' ? file : `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
        {
          folder: `quiubole/documents/${documentType}`,
          resource_type: 'image',
          public_id: `${userId}_${documentType}_${Date.now()}`,
          allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
          max_bytes: 5 * 1024 * 1024, // 5MB
        },
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        bytes: result.bytes,
      };
    } catch (error) {
      this.logger.error('Error uploading document:', error);
      throw new BadRequestException('Error al subir el documento');
    }
  }

  // ==========================================
  // HELPERS
  // ==========================================

  private getTransformations(folder: ImageFolder, custom?: UploadOptions['transformation']) {
    if (custom) return custom;

    // Transformaciones por defecto según el tipo
    const defaults: Record<ImageFolder, any> = {
      products: {
        width: 800,
        height: 800,
        crop: 'fill',
        quality: 'auto:good',
      },
      restaurants: {
        width: 1200,
        height: 600,
        crop: 'fill',
        quality: 'auto:good',
      },
      users: {
        width: 400,
        height: 400,
        crop: 'thumb',
        gravity: 'face',
        quality: 'auto:good',
      },
      drivers: {
        width: 400,
        height: 400,
        crop: 'thumb',
        gravity: 'face',
        quality: 'auto:good',
      },
      documents: {
        width: 1000,
        quality: 'auto:best',
      },
      reviews: {
        width: 600,
        height: 600,
        crop: 'limit',
        quality: 'auto:good',
      },
    };

    return defaults[folder];
  }

  private simulateUpload(folder: string): UploadResult {
    const fakeId = `fake_${folder}_${Date.now()}`;
    return {
      url: `https://via.placeholder.com/400?text=${folder}`,
      publicId: fakeId,
      width: 400,
      height: 400,
      format: 'png',
      bytes: 10000,
    };
  }

  // Validar que el archivo sea una imagen válida
  validateImageFile(file: Express.Multer.File): void {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido. Use JPG, PNG, WEBP o GIF.');
    }

    if (file.size > maxSize) {
      throw new BadRequestException('El archivo es muy grande. Máximo 10MB.');
    }
  }
}
