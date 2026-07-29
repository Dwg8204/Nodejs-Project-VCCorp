import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';
import { IMAGE_UPLOAD_OPTIONS } from '../config/image-upload.options';
import { CloudinaryService } from '../services/cloudinary.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('images')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  async uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('UPLOAD_IMAGE_REQUIRED');
    const root = this.cloudinaryService.rootFolder;
    const uploaded = await this.cloudinaryService.uploadImage({
      buffer: file.buffer,
      publicId: `${root}/uploads/${user.id}/${randomUUID()}`,
      preset: 'post',
    });
    return {
      success: true,
      message: 'UPLOAD_IMAGE_SUCCEEDED',
      data: {
        image: {
          url: uploaded.secure_url,
          publicId: uploaded.public_id,
          width: uploaded.width,
          height: uploaded.height,
          bytes: uploaded.bytes,
        },
      },
    };
  }
}
