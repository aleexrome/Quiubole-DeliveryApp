// ==========================================
// IMAGES SERVICE - Mobile (Expo)
// ==========================================

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Linking, Platform } from 'react-native';
import api from './api';

// Tipos
export interface ImageAsset {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  type?: string;
  fileName?: string;
}

export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format: string;
  bytes: number;
}

export type ImageFolder = 'products' | 'restaurants' | 'users' | 'drivers' | 'documents' | 'reviews';

class ImageService {
  // ==========================================
  // PERMISOS
  // ==========================================

  async requestCameraPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a la cámara para tomar fotos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configuración', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }

    return true;
  }

  async requestLibraryPermissions(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para seleccionar fotos.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configuración', onPress: () => Linking.openSettings() },
        ],
      );
      return false;
    }

    return true;
  }

  // ==========================================
  // SELECCIÓN DE IMÁGENES
  // ==========================================

  async pickFromCamera(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<ImageAsset | null> {
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsEditing ?? true,
        aspect: options?.aspect ?? [1, 1],
        quality: options?.quality ?? 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      return {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
        type: asset.mimeType,
        fileName: asset.fileName || `photo_${Date.now()}.jpg`,
      };
    } catch (error) {
      console.error('Error picking from camera:', error);
      Alert.alert('Error', 'No se pudo tomar la foto');
      return null;
    }
  }

  async pickFromLibrary(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
    allowsMultipleSelection?: boolean;
    selectionLimit?: number;
  }): Promise<ImageAsset[] | null> {
    const hasPermission = await this.requestLibraryPermissions();
    if (!hasPermission) return null;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options?.allowsMultipleSelection ? false : (options?.allowsEditing ?? true),
        aspect: options?.aspect ?? [1, 1],
        quality: options?.quality ?? 0.8,
        base64: true,
        allowsMultipleSelection: options?.allowsMultipleSelection ?? false,
        selectionLimit: options?.selectionLimit ?? 1,
      });

      if (result.canceled || !result.assets.length) {
        return null;
      }

      return result.assets.map((asset) => ({
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        base64: asset.base64,
        type: asset.mimeType,
        fileName: asset.fileName || `image_${Date.now()}.jpg`,
      }));
    } catch (error) {
      console.error('Error picking from library:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      return null;
    }
  }

  // Mostrar opciones (cámara o galería)
  async pickWithOptions(options?: {
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }): Promise<ImageAsset | null> {
    return new Promise((resolve) => {
      Alert.alert('Seleccionar imagen', '¿De dónde quieres obtener la imagen?', [
        {
          text: 'Cámara',
          onPress: async () => {
            const result = await this.pickFromCamera(options);
            resolve(result);
          },
        },
        {
          text: 'Galería',
          onPress: async () => {
            const results = await this.pickFromLibrary(options);
            resolve(results?.[0] || null);
          },
        },
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ]);
    });
  }

  // ==========================================
  // PROCESAMIENTO DE IMÁGENES
  // ==========================================

  async resizeImage(
    uri: string,
    maxWidth: number = 800,
    maxHeight: number = 800,
  ): Promise<ImageAsset> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      base64: result.base64,
    };
  }

  async compressImage(uri: string, quality: number = 0.7): Promise<ImageAsset> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      {
        compress: quality,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      base64: result.base64,
    };
  }

  async cropImage(
    uri: string,
    originX: number,
    originY: number,
    width: number,
    height: number,
  ): Promise<ImageAsset> {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ crop: { originX, originY, width, height } }],
      {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      },
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      base64: result.base64,
    };
  }

  // ==========================================
  // SUBIDA AL SERVIDOR
  // ==========================================

  async uploadImage(image: ImageAsset, folder: ImageFolder): Promise<UploadResult | null> {
    try {
      // Preparar base64 con prefijo
      const base64Data = image.base64?.startsWith('data:')
        ? image.base64
        : `data:image/jpeg;base64,${image.base64}`;

      const response = await api.post('/uploads/image/base64', {
        base64: base64Data,
        folder,
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen');
      return null;
    }
  }

  async uploadMultipleImages(
    images: ImageAsset[],
    folder: ImageFolder,
    onProgress?: (current: number, total: number) => void,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < images.length; i++) {
      onProgress?.(i + 1, images.length);

      const result = await this.uploadImage(images[i], folder);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  // Subir documento (para repartidores)
  async uploadDocument(
    image: ImageAsset,
    documentType: 'ine' | 'license' | 'insurance' | 'vehicle',
  ): Promise<UploadResult | null> {
    try {
      const base64Data = image.base64?.startsWith('data:')
        ? image.base64
        : `data:image/jpeg;base64,${image.base64}`;

      const response = await api.post(`/uploads/document/${documentType}`, {
        base64: base64Data,
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert('Error', 'No se pudo subir el documento');
      return null;
    }
  }

  // ==========================================
  // ELIMINACIÓN
  // ==========================================

  async deleteImage(publicId: string): Promise<boolean> {
    try {
      await api.delete('/uploads/image', { data: { publicId } });
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  // Obtener URL optimizada para thumbnails
  getThumbnailUrl(url: string, size: number = 150): string {
    // Si es Cloudinary, transformar URL
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', `/upload/w_${size},h_${size},c_thumb,q_auto/`);
    }
    return url;
  }

  // Obtener URL optimizada para preview
  getPreviewUrl(url: string, width: number = 400): string {
    if (url.includes('cloudinary.com')) {
      return url.replace('/upload/', `/upload/w_${width},q_auto/`);
    }
    return url;
  }

  // Validar tamaño de imagen
  validateImageSize(image: ImageAsset, maxSizeMB: number = 10): boolean {
    if (!image.base64) return true;

    // Calcular tamaño aproximado del base64
    const sizeInBytes = (image.base64.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    return sizeInMB <= maxSizeMB;
  }

  // Obtener extensión del archivo
  getFileExtension(uri: string): string {
    const match = uri.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : 'jpg';
  }
}

export const imageService = new ImageService();
export default imageService;
