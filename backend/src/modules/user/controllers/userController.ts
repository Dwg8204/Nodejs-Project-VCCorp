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
import { UserService } from 'modules/user/services/userService';
import { UpdateProfileDto, QueryUserDto } from 'modules/user/validations/userValidation';
import { RoleName } from 'common/enums/database.enums';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}



  /**
   * Lấy thông tin profile người dùng hiện tại
   * GET /api/users/profile
   * @access Private (cần đăng nhập)
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return this.userService.getProfile(req.user.id);
  }

  /**
   * Cập nhật thông tin profile
   * PUT /api/users/profile
   * @access Private
   */
  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, updateProfileDto);
  }

  /**
   * Lấy danh sách tất cả users (Admin only)
   * GET /api/users?page=1&limit=10&search=keyword
   * @access Private (Admin)
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SuperAdmin)
  getAllUsers(@Query() queryDto: QueryUserDto) {
    return this.userService.getAllUsers(queryDto);
  }

  /**
   * Lấy thông tin user theo ID
   * GET /api/users/:id
   * @access Private (Admin)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SuperAdmin)
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userService.getUserById(id);
  }

  /**
   * Xóa user theo ID
   * DELETE /api/users/:id
   * @access Private (Admin)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.SuperAdmin)
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deleteUser(id);
  }
}
