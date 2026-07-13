/**
 * =============================================================
 * User Controller - Nhận và xử lý yêu cầu từ người dùng
 * =============================================================
 *
 * Đặt tên file: xXXController.ts (camelCase)
 * Trong NestJS, Controller định nghĩa routes qua decorators.
 *
 * Routes được tạo tự động:
 *   POST   /api/users/register     → register()
 *   POST   /api/users/login        → login()
 *   GET    /api/users/profile      → getProfile()
 *   PUT    /api/users/profile      → updateProfile()
 *   GET    /api/users              → getAllUsers()
 *   GET    /api/users/:id          → getUserById()
 *   DELETE /api/users/:id          → deleteUser()
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthService } from 'modules/auth/services/authService';
import { RegisterDto, LoginDto } from 'modules/auth/validations/authValidation';
import { AuthGuard } from 'modules/auth/middlewares/authMiddleware';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Đăng ký tài khoản mới
   * POST /api/auth/register
   * @access Public
   */
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Đăng nhập
   * POST /api/auth/login
   * @access Public
   */
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  
}
