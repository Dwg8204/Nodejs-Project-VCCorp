import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './models/post';
import { PostTranslation } from './models/postTranslation';
import { PostPublicController } from './controllers/postPublicController';
import { PostOwnerController } from './controllers/postOwnerController';
import { PostAdminController } from './controllers/postAdminController';
import { PostPublicService } from './services/postPublicService';
import { PostOwnerService } from './services/postOwnerService';
import { PostAdminService } from './services/postAdminService';
import { AuditModule } from 'modules/audit/audit.module';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostTranslation]),
    AuditModule,
    AuthModule,
    UserModule,
  ],
  controllers: [
    PostPublicController,
    PostOwnerController,
    PostAdminController,
  ],
  providers: [
    PostPublicService,
    PostOwnerService,
    PostAdminService,
  ],
  exports: [TypeOrmModule],
})
export class PostModule {}
