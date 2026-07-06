/**
 * =============================================================
 * User Module - NestJS Module cho User
 * =============================================================
 *
 * Đăng ký Controller, Service, Entity, Guards cho module User.
 * Mỗi module trong modules/ cần có file xxx.module.ts
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from 'modules/user/models/user';
import { UserController } from 'modules/user/controllers/userController';
import { UserService } from 'modules/user/services/userService';
import { AuthGuard, RolesGuard } from 'modules/user/middlewares/authMiddleware';

@Module({
  imports: [
    // Đăng ký Entity User với TypeORM
    TypeOrmModule.forFeature([User]),

    // Đăng ký JwtModule
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN', '7d');
        return {
          secret: configService.get<string>('JWT_SECRET', 'default_secret'),
          signOptions: {
            expiresIn: expiresIn as any,
          },
        };
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService, AuthGuard, RolesGuard],
  exports: [UserService, AuthGuard, RolesGuard, JwtModule],
})
export class UserModule {}
