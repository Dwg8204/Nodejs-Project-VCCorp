import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { LikeService } from '../services/likeService';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';

@Controller('posts/:postId/likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyLike(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
  ) {
    return this.likeService.getMyLike(user.id, postId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
  ) {
    return this.likeService.toggleLike(user.id, postId);
  }
}
