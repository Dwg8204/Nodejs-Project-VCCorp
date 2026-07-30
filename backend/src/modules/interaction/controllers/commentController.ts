import { Controller, Delete, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CommentService } from '../services/commentService';
import { CreateCommentDto, QueryCommentDto } from '../validations/interactionValidation';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from 'modules/auth/interfaces/auth-user.interface';

@Controller('posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  findByPost(
    @Param('postId') postId: string,
    @Query() query: QueryCommentDto,
  ) {
    return this.commentService.findByPost(postId, query);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentService.create(user.id, postId, dto);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.commentService.remove(user.id, postId, commentId);
  }
}
