import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadsService {
  private uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get('UPLOAD_DIR') || './uploads';
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'general') {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds limit');
    }

    const folderPath = path.join(this.uploadDir, folder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    const filePath = path.join(folderPath, filename);

    fs.writeFileSync(filePath, file.buffer);

    const baseUrl = this.configService.get('API_URL') || 'http://localhost:3000';
    const url = `${baseUrl}/uploads/${folder}/${filename}`;

    return {
      filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url,
      path: `${folder}/${filename}`,
    };
  }

  async uploadMultiple(files: Express.Multer.File[], folder: string = 'general') {
    const results = [];
    for (const file of files) {
      const result = await this.uploadFile(file, folder);
      results.push(result);
    }
    return results;
  }

  async deleteFile(filePath: string) {
    const fullPath = path.join(this.uploadDir, filePath);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return { success: true };
    }

    throw new BadRequestException('File not found');
  }

  async getFileUrl(filePath: string) {
    const baseUrl = this.configService.get('API_URL') || 'http://localhost:3000';
    return `${baseUrl}/uploads/${filePath}`;
  }

  // Generate signed URL for private files (placeholder for S3/cloud storage)
  async getSignedUrl(filePath: string, expiresIn: number = 3600) {
    // In production, integrate with S3 or cloud storage
    return this.getFileUrl(filePath);
  }
}
