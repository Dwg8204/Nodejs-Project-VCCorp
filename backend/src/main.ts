/**
 * =============================================================
 * VCCorp Backend - NestJS Entry Point
 * =============================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefix toàn cục: tất cả routes sẽ bắt đầu với /api
  app.setGlobalPrefix('api');

  // Bật CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // ValidationPipe toàn cục - tự động validate DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Loại bỏ các field không có trong DTO
      forbidNonWhitelisted: true, // Throw lỗi nếu gửi field không hợp lệ
      transform: true,        // Tự động chuyển đổi kiểu dữ liệu
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT);

  console.log('='.repeat(50));
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
  console.log(`💚 Health: http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
}

bootstrap();
