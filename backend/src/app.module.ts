/**
 * =============================================================
 * App Module - Root Module của ứng dụng NestJS
 * =============================================================
 *
 * Import tất cả các module con tại đây.
 * Sử dụng đường dẫn tuyệt đối tính từ thư mục src/
 */

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'modules/user/user.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    // Load biến môi trường từ .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Kết nối MySQL (XAMPP)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql' as const,
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get<string>('DB_USER', 'root'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'vccorp_db'),
        autoLoadEntities: true, // Tự động load entities từ các module
        synchronize: configService.get<string>('NODE_ENV') === 'development', // Tự động tạo/sync bảng (chỉ dev)
        timezone: '+07:00',
      }),
    }),

    // =============================================================
    // Import các module nghiệp vụ tại đây
    // Ví dụ: CategoryModule, ProductModule, OrderModule, ...
    // =============================================================
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
