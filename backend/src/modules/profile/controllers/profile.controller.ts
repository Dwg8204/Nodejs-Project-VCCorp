import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { RequestMetadata } from 'modules/auth/decorators/request-context.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { IMAGE_UPLOAD_OPTIONS } from 'modules/upload/config/image-upload.options';
import {
  AuthenticatedUser,
  RequestContext,
} from 'modules/auth/interfaces/auth-user.interface';
import { ProfileService } from '../services/profile.service';
import {
  ProfileImageType,
  UpdateProfileDto,
} from '../validations/profile.validation';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  findProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.findProfile(user.id);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
    @RequestMetadata() context: RequestContext,
  ) {
    return this.profileService.updateProfile(user.id, dto, context);
  }

  @Post('images/:type')
  @UseInterceptors(FileInterceptor('file', IMAGE_UPLOAD_OPTIONS))
  uploadImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('type', new ParseEnumPipe(ProfileImageType))
    type: ProfileImageType,
    @UploadedFile() file: Express.Multer.File,
    @RequestMetadata() context: RequestContext,
  ) {
    if (!file) throw new BadRequestException('UPLOAD_IMAGE_REQUIRED');
    return this.profileService.uploadImage(user.id, type, file, context);
  }
}
