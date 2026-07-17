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
import { AuthModule } from 'modules/auth/auth.module';
import { User } from 'modules/user/models/user';
import { Role } from 'modules/user/models/role';
import { UserController } from 'modules/user/controllers/userController';
import { UserService } from 'modules/user/services/userService';
import { AuthGuard, RolesGuard } from 'modules/user/middlewares/authMiddleware';

@Module({
  imports: [
    // Đăng ký Entity User và Role với TypeORM
    TypeOrmModule.forFeature([User, Role]),

    // Đăng ký AuthModule
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, AuthGuard, RolesGuard],
  exports: [UserService, AuthGuard, RolesGuard, TypeOrmModule],
})
export class UserModule {}
