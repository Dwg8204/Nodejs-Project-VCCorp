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
  @IsNotEmpty({ message: 'Tên người dùng là bắt buộc' })
  @IsString()
  @MinLength(2, { message: 'Tên người dùng phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên người dùng không được quá 50 ký tự' })
  userName: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

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

