import {
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
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

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  avatar?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  coverImage?: string | null;
}
