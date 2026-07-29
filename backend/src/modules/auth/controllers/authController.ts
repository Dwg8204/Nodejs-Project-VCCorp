import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { CurrentUser } from '../decorators/current-user.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
  AuthenticatedUser,
  RequestContext,
} from '../interfaces/auth-user.interface';
import { AuthService } from '../services/authService';
import { AuthCookieService } from '../services/auth-cookie.service';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyOtpDto,
} from '../validations/authValidation';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookie: AuthCookieService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const result = await this.authService.register(
      dto,
      this.requestContext(ipAddress, userAgent),
    );
    this.authCookie.set(response, result.data.accessToken);
    return {
      ...result,
      data: { user: result.data.user },
    };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const result = await this.authService.login(
      dto,
      this.requestContext(ipAddress, userAgent),
    );
    this.authCookie.set(response, result.data.accessToken);
    return {
      ...result,
      data: { user: result.data.user },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
    @Res({ passthrough: true }) response?: Response,
  ) {
    const result = await this.authService.logout(
      user,
      this.requestContext(ipAddress, userAgent),
    );
    this.authCookie.clear(response);
    return result;
  }

  @Post('forgot-password')
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.forgotPassword(
      dto,
      this.requestContext(ipAddress, userAgent),
    );
  }

  @Post('verify-otp')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.verifyOtp(
      dto,
      this.requestContext(ipAddress, userAgent),
    );
  }

  @Post('reset-password')
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.authService.resetPassword(
      dto,
      this.requestContext(ipAddress, userAgent),
    );
  }

  private requestContext(
    ipAddress: string,
    userAgent?: string,
  ): RequestContext {
    return { ipAddress, userAgent };
  }
}
