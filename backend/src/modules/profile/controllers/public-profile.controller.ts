import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ProfileService } from '../services/profile.service';

@Controller('profiles')
export class PublicProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get(':id')
  findPublicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.profileService.findPublicProfile(id);
  }
}
