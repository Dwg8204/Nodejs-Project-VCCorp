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
import { User } from 'modules/user/models/user';
import { Role } from 'modules/user/models/role';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  exports: [TypeOrmModule],
})
export class UserModule {}
