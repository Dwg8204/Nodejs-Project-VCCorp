import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { AuthModule } from 'modules/auth/auth.module';
import { UploadController } from './controllers/upload.controller';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class UploadModule {}
