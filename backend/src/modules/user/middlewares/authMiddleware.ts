/**
 * =============================================================
 * Auth Middleware - Xác thực và phân quyền (NestJS Guards)
 * =============================================================
 *
 * Đặt tên file: xXXMiddleware.ts (camelCase)
 *
 * Trong NestJS, authentication và authorization sử dụng Guards
 * thay vì middleware truyền thống. Guards quyết định request
 * có được xử lý hay không dựa trên điều kiện (token, role, ...).
 *
 * Bao gồm:
 *   - AuthGuard: Xác thực JWT token
 *   - RolesGuard: Phân quyền theo role
 *   - @Roles() decorator: Gán role cho route
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'modules/user/models/user';

// =============================================================
// Custom Decorator: @Roles('admin', 'moderator')
// =============================================================
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// =============================================================
// AuthGuard - Xác thực JWT Token
// =============================================================
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Lấy token từ header Authorization: Bearer <token>
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Vui lòng đăng nhập để truy cập');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify token
      const decoded = this.jwtService.verify(token);

      // Tìm user từ token
      const user = await this.userRepository.findOne({
        where: { id: decoded.id },
      });

      if (!user) {
        throw new UnauthorizedException('Người dùng không tồn tại');
      }

      // Kiểm tra tài khoản có active không
      if (!user.isActive) {
        throw new ForbiddenException('Tài khoản đã bị khóa');
      }

      // Gán user vào request
      request.user = {
        id: user.id,
        email: user.email,
        role: user.role?.nameRole || '',
        name: user.userName,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token đã hết hạn, vui lòng đăng nhập lại');
      }

      throw new UnauthorizedException('Token không hợp lệ');
    }
  }
}

// =============================================================
// RolesGuard - Phân quyền theo Role
// =============================================================
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách roles từ @Roles() decorator
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler(),
    );

    // Nếu route không yêu cầu role → cho phép
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Vui lòng đăng nhập để truy cập');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
    }

    return true;
  }
}
