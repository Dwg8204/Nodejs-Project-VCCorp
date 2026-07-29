/**
 * =============================================================
 * App Module - Root Module của ứng dụng NestJS
 * =============================================================
 *
 * Import tất cả các module con tại đây.
 * Sử dụng đường dẫn tuyệt đối tính từ thư mục src/
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from 'config/environment';
import { DatabaseModule } from 'database/database.module';
import { AuditModule } from 'modules/audit/audit.module';
import { InteractionModule } from 'modules/interaction/interaction.module';
import { PostModule } from 'modules/post/post.module';
import { UserModule } from 'modules/user/user.module';
import { AuthModule } from 'modules/auth/auth.module';
import { LanguageModule } from 'modules/language/language.module';
import { CategoryModule } from 'modules/category/category.module';
import { DashboardModule } from 'modules/dashboard/dashboard.module';
import { UploadModule } from 'modules/upload/upload.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Load biến môi trường từ .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,

    // =============================================================
    // Import các module nghiệp vụ
    // =============================================================
    UserModule,
    AuthModule,
    LanguageModule,
    CategoryModule,
    PostModule,
    InteractionModule,
    AuditModule,
    DashboardModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
