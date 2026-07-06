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
import { RegisterDto, LoginDto, UpdateProfileDto, QueryUserDto } from 'modules/user/validations/userValidation';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Đăng ký tài khoản mới
   */
  async register(registerDto: RegisterDto) {
    const { name, email, password, confirmPassword } = registerDto;

    // Kiểm tra mật khẩu xác nhận
    if (password !== confirmPassword) {
      throw new ConflictException('Mật khẩu xác nhận không khớp');
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Tạo user mới (password tự động hash qua @BeforeInsert hook)
    const user = this.userRepository.create({ name, email, password });
    await this.userRepository.save(user);

    // Tạo JWT token
    const token = this.generateToken(user);

    // Loại bỏ password khỏi response
    delete user.password;

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

    // Tìm user theo email (bao gồm password)
    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'name', 'email', 'password', 'role', 'isActive', 'avatar', 'phone', 'createdAt'],
    });

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
    delete user.password;

    return {
      success: true,
      message: 'Đăng nhập thành công',
      data: { user, token },
    };
  }

  /**
   * Lấy thông tin profile theo ID
   */
  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      data: { user },
    };
  }

  /**
   * Cập nhật profile
   */
  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Chỉ cập nhật các trường được gửi lên
    Object.assign(user, updateProfileDto);
    await this.userRepository.save(user);

    return {
      success: true,
      message: 'Cập nhật thông tin thành công',
      data: { user },
    };
  }

  /**
   * Lấy danh sách tất cả users (có phân trang)
   */
  async getAllUsers(queryDto: QueryUserDto) {
    const { page = 1, limit = 10, search = '' } = queryDto;
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    // Tạo query builder
    const queryBuilder = this.userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.name LIKE :search OR user.email LIKE :search',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('user.created_at', 'DESC')
      .skip(skip)
      .take(take);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    };
  }

  /**
   * Lấy user theo ID
   */
  async getUserById(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    return {
      success: true,
      data: { user },
    };
  }

  /**
   * Xóa user theo ID
   */
  async deleteUser(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.userRepository.remove(user);

    return {
      success: true,
      message: 'Xóa người dùng thành công',
    };
  }

  /**
   * Tạo JWT token
   */
  private generateToken(user: User): string {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}
