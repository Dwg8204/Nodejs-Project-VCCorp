import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './models/comment';
import { PostLike } from './models/postLike';
import { CommentController } from './controllers/commentController';
import { LikeController } from './controllers/likeController';
import { CommentService } from './services/commentService';
import { LikeService } from './services/likeService';
import { PostModule } from 'modules/post/post.module';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';
import { InteractionRealtimeService } from './services/interaction-realtime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comment, PostLike]),
    PostModule,
    AuthModule,
    UserModule,
  ],
  controllers: [CommentController, LikeController],
  providers: [CommentService, LikeService, InteractionRealtimeService],
  exports: [TypeOrmModule, InteractionRealtimeService],
})
export class InteractionModule {}
