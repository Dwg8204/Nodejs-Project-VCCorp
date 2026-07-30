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
import { Category } from 'modules/category/models/category';
import { Language } from 'modules/language/models/language';
import { PostTranslation } from 'modules/post/models/postTranslation';
import { AuditLog } from 'modules/audit/models/auditLog';
import { InteractionModule } from 'modules/interaction/interaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment, PostLike, User, Category, Language, PostTranslation, AuditLog]),
    AuthModule,
    UserModule,
    InteractionModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
