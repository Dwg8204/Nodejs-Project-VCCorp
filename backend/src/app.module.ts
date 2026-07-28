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
import { AdminUsersModule } from 'modules/admin-users/admin-users.module';
import { AdminLanguagesModule } from 'modules/admin-languages/admin-languages.module';
import { AdminAuditLogsModule } from 'modules/admin-audit-logs/admin-audit-logs.module';
import { InteractionModule } from 'modules/interaction/interaction.module';
import { PostModule } from 'modules/post/post.module';
import { ProfileModule } from 'modules/profile/profile.module';
import { UserModule } from 'modules/user/user.module';
import { AuthModule } from 'modules/auth/auth.module';
import { LanguageModule } from 'modules/language/language.module';
import { CategoryModule } from 'modules/category/category.module';
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
    ProfileModule,
    AdminUsersModule,
    AdminLanguagesModule,
    AdminAuditLogsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
