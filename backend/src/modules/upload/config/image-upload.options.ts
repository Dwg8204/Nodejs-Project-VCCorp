import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const IMAGE_UPLOAD_OPTIONS: MulterOptions = {
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(new BadRequestException('UPLOAD_IMAGE_TYPE_NOT_ALLOWED'), false);
      return;
    }
    callback(null, true);
  },
};
