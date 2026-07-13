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
// DTO cho cập nhật profile
// =============================================================
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(255, { message: 'Tên không được quá 255 ký tự' })
  fullName?: string;

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
