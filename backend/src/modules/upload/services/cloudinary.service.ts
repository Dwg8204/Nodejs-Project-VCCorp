import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';

export type ImagePreset = 'avatar' | 'cover' | 'post';

@Injectable()
export class CloudinaryService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: config.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: config.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  uploadImage(input: {
    buffer: Buffer;
    publicId: string;
    preset: ImagePreset;
  }): Promise<UploadApiResponse> {
    this.assertConfigured();
    const transformation =
      input.preset === 'avatar'
        ? [{ width: 800, height: 800, crop: 'limit' }]
        : [{ width: 2400, height: 1600, crop: 'limit' }];

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          public_id: input.publicId,
          overwrite: true,
          invalidate: true,
          unique_filename: false,
          transformation,
          format: 'webp',
          quality: 'auto:good',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            reject(
              new ServiceUnavailableException('UPLOAD_CLOUDINARY_FAILED'),
            );
            return;
          }
          resolve(result);
        },
      );
      stream.end(input.buffer);
    });
  }

  profilePublicId(userId: number, type: 'avatar' | 'cover'): string {
    return `${this.rootFolder}/users/${userId}/${type}`;
  }

  get rootFolder(): string {
    return this.config.getOrThrow<string>('CLOUDINARY_FOLDER');
  }

  private assertConfigured(): void {
    const keys = [
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
    ];
    if (keys.some((key) => !this.config.getOrThrow<string>(key))) {
      throw new ServiceUnavailableException('UPLOAD_CLOUDINARY_NOT_CONFIGURED');
    }
  }
}
