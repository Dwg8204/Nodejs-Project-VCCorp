import { Module } from '@nestjs/common';
import { AuditModule } from 'modules/audit/audit.module';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';
import { ProfileController } from './controllers/profile.controller';
import { ProfileService } from './services/profile.service';

@Module({
  imports: [UserModule, AuthModule, AuditModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
