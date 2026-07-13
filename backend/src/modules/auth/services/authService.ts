/**
 * =============================================================
 * User Service - Xử lý logic nghiệp vụ cho User
 * =============================================================
 *
 * Đặt tên file: xxxService.ts (camelCase)
 * Service chỉ chứa business logic, không xử lý request/response.
 * Sử dụng Dependency Injection của NestJS.
 */

import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from 'modules/user/models/user';
import { RegisterDto, LoginDto } from 'modules/auth/validations/authValidation';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản mới
   */
  async register(registerDto: RegisterDto) {
    const { userName, fullName, email, password, confirmPassword } = registerDto;

    // Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
      throw new ConflictException('Mật khẩu xác nhận không khớp');
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Kiểm tra user_name đã tồn tại chưa
    const existingUserName = await this.userRepository.findOne({ where: { userName } });
    if (existingUserName) {
      throw new ConflictException('Tên người dùng đã được sử dụng');
    }

    // Tạo user mới (password tự động hash qua @BeforeInsert hook)
    const user = this.userRepository.create({
      userName,
      fullName,
      email,
      passwordHash: password,
      role: { id: 3 } as any // AUTHENTICATED_USER
    });
    await this.userRepository.save(user);

    // Tạo JWT token
    const token = this.generateToken(user);

    // Loại bỏ password khỏi response
    delete user.passwordHash;

    return {
      success: true,
      message: 'Đăng ký thành công',
      data: { user, token },
    };
  }

  /**
   * Đăng nhập
   */
  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Tìm user theo email (bao gồm passwordHash)
    const user = await this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra tài khoản có active không
    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    // So sánh password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Tạo JWT token
    const token = this.generateToken(user);

    // Loại bỏ password khỏi response
    delete user.passwordHash;

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: { user, token },
    };
  }



  /**
   * Tạo JWT token
   */
  private generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role?.nameRole || 'AUTHENTICATED_USER',
    };
    return this.jwtService.sign(payload);
  }
}
