import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { RequestMetadata } from 'modules/auth/decorators/request-context.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  RequestContext,
} from 'modules/auth/interfaces/auth-user.interface';
import { ProfileService } from '../services/profile.service';
import { UpdateProfileDto } from '../validations/profile.validation';

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
}
