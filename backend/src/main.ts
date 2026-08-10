/**
 * =============================================================
 * VCCorp Backend - NestJS Entry Point
 * =============================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Prefix toàn cục: tất cả routes sẽ bắt đầu với /api
  app.setGlobalPrefix('api');

  // Bật CORS
  const allowedOrigins = config
    .getOrThrow<string>('CORS_ORIGIN')
    .split(',')
    .map((origin) => origin.trim());
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Cookie authentication needs explicit Origin validation for state-changing
  // browser requests, especially when production uses SameSite=None.
  app.use((request, response, next) => {
    const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
    const origin = request.headers.origin;
    if (
      !safeMethods.has(request.method)
      && origin
      && !allowedOrigins.includes(origin)
    ) {
      response.status(403).json({
        message: 'AUTH_ORIGIN_FORBIDDEN',
        error: 'Forbidden',
        statusCode: 403,
      });
      return;
    }
    next();
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

  app.enableShutdownHooks();

  const port = config.getOrThrow<number>('PORT');
  const nodeEnvironment = config.getOrThrow<string>('NODE_ENV');
  const publicDirectory = join(process.cwd(), 'public');

  if (nodeEnvironment === 'production' && existsSync(publicDirectory)) {
    app.useStaticAssets(publicDirectory, { index: false });
  }

  // Khởi tạo controller trước khi gắn SPA fallback để /api luôn được NestJS
  // xử lý, còn các URL phía giao diện như /profile hoặc /admin/posts trả về
  // Angular index.html khi người dùng tải lại trang.
  await app.init();

  if (nodeEnvironment === 'production' && existsSync(publicDirectory)) {
    const express = app.getHttpAdapter().getInstance();
    express.use((request, response, next) => {
      const acceptsHtml = request.accepts?.('html');
      if (
        request.method !== 'GET'
        || request.path.startsWith('/api')
        || !acceptsHtml
      ) {
        next();
        return;
      }

      response.sendFile(join(publicDirectory, 'index.html'));
    });
  }

  await app.listen(port, '0.0.0.0');

  console.log('='.repeat(50));
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📍 Environment: ${nodeEnvironment}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`📋 API: http://localhost:${port}/api`);
  console.log(`💚 Health: http://localhost:${port}/api/health`);
  console.log('='.repeat(50));
}

bootstrap();
