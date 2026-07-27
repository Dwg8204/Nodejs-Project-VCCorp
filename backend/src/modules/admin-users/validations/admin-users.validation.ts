import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from 'common/dto/pagination-query.dto';
import { RoleName } from 'common/enums/database.enums';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export enum UserStatusFilter {
  Active = 'ACTIVE',
  Locked = 'LOCKED',
}

export enum UserSort {
  Newest = 'newest',
  Oldest = 'oldest',
  Ascending = 'a-z',
  Descending = 'z-a',
}

export class QueryAdminUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(191)
  search = '';

  @IsOptional()
  @IsEnum(RoleName)
  role?: RoleName;

  @IsOptional()
  @IsEnum(UserStatusFilter)
  status?: UserStatusFilter;

  @IsOptional()
  @IsEnum(UserSort)
  sort: UserSort = UserSort.Newest;
}

export class CreateAdminUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  userName: string;

  @IsEmail()
  @MaxLength(191)
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @IsOptional()
  @Matches(/^(\+84|0)\d{9,10}$/)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN)
  password: string;

  @Type(() => String)
  @IsEnum(RoleName)
  role: RoleName;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  userName?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName?: string | null;

  @IsOptional()
  @Matches(/^(\+84|0)\d{9,10}$/)
  phone?: string | null;
}

export class ChangeUserRoleDto {
  @IsEnum(RoleName)
  role: RoleName;
}
