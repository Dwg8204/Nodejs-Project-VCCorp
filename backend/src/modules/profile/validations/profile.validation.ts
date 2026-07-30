import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^(\+84|0)\d{9,10}$/)
  phone?: string | null;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string | null;

}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'AUTH_PASSWORD_COMPLEXITY_REQUIRED',
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

export enum ProfileImageType {
  Avatar = 'avatar',
  Cover = 'cover',
}
