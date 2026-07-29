import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from 'modules/post/models/post';
import { Comment } from 'modules/interaction/models/comment';
import { PostLike } from 'modules/interaction/models/postLike';
import { User } from 'modules/user/models/user';
import { DashboardController } from './controllers/dashboardController';
import { DashboardService } from './services/dashboardService';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment, PostLike, User]),
    AuthModule,
    UserModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
