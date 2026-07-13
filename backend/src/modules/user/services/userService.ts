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
import { User } from 'modules/user/models/user';
import { UpdateProfileDto, QueryUserDto } from 'modules/user/validations/userValidation';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}



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
        'user.userName LIKE :search OR user.fullName LIKE :search OR user.email LIKE :search',
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


}
