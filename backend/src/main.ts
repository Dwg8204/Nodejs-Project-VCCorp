/**
 * =============================================================
 * VCCorp Backend - NestJS Entry Point
 * =============================================================
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(port);

  console.log('='.repeat(50));
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📍 Environment: ${nodeEnvironment}`);
  console.log(`🔗 URL: http://localhost:${port}`);
  console.log(`📋 API: http://localhost:${port}/api`);
  console.log(`💚 Health: http://localhost:${port}/api/health`);
  console.log('='.repeat(50));
}

bootstrap();
