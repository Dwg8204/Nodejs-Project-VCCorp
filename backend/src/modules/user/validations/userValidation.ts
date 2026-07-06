/**
 * =============================================================
 * User Validation - DTOs (Data Transfer Objects)
 * =============================================================
 *
 * Đặt tên file: xXXValidation.ts (camelCase)
 * Sử dụng class-validator để validate dữ liệu đầu vào.
 * NestJS tự động validate qua ValidationPipe toàn cục.
 */

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsUrl,
  IsNumber,
  Min,
} from 'class-validator';

// =============================================================
// DTO cho đăng ký
// =============================================================
export class RegisterDto {
  @IsNotEmpty({ message: 'Tên là bắt buộc' })
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên không được quá 50 ký tự' })
  name: string;

  @IsNotEmpty({ message: 'Email là bắt buộc' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số',
  })
  password: string;

  @IsNotEmpty({ message: 'Xác nhận mật khẩu là bắt buộc' })
  @IsString()
  confirmPassword: string;
}

// =============================================================
// DTO cho đăng nhập
// =============================================================
export class LoginDto {
  @IsNotEmpty({ message: 'Email là bắt buộc' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu là bắt buộc' })
  password: string;
}

// =============================================================
// DTO cho cập nhật profile
// =============================================================
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên không được quá 50 ký tự' })
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(\+84|0)\d{9,10}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'Avatar phải là một URL hợp lệ' })
  avatar?: string;
}

// =============================================================
// DTO cho query params (phân trang + tìm kiếm)
// =============================================================
export class QueryUserDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string = '';
}
