import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UploadController } from './controllers/uploadController';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    MulterModule.register({
      storage: diskStorage({
        destination: './public/uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
    }),
  ],
  controllers: [UploadController],
})
export class UploadModule {}
