import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  userName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(255)
  fullName: string;

  @IsEmail()
  @MaxLength(191)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, {
    message: 'AUTH_PASSWORD_COMPLEXITY_REQUIRED',
  })
  password: string;

  @IsString()
  confirmPassword: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(191)
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(191)
  email: string;
}

export class VerifyOtpDto {
  @IsEmail()
  @MaxLength(191)
  email: string;

  @IsString()
  @Matches(/^\d{6}$/, { message: 'AUTH_OTP_MUST_HAVE_SIX_DIGITS' })
  otp: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  resetToken: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(PASSWORD_PATTERN, {
    message: 'AUTH_PASSWORD_COMPLEXITY_REQUIRED',
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
