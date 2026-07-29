import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'modules/user/models/user';
import { Role } from 'modules/user/models/role';
import { AuthController } from './controllers/authController';
import { AuthService } from './services/authService';
import { AuditModule } from 'modules/audit/audit.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { MailModule } from 'modules/mail/mail.module';
import { AuthCookieService } from './services/auth-cookie.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    AuditModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<string>('JWT_EXPIRES_IN') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthCookieService, JwtAuthGuard, RolesGuard],
  exports: [AuthService, JwtModule, JwtAuthGuard, RolesGuard, TypeOrmModule],
})
export class AuthModule {}
