import { Module } from '@nestjs/common';
import { AuditModule } from 'modules/audit/audit.module';
import { AuthModule } from 'modules/auth/auth.module';
import { UserModule } from 'modules/user/user.module';
import { UploadModule } from 'modules/upload/upload.module';
import { ProfileController } from './controllers/profile.controller';
import { PublicProfileController } from './controllers/public-profile.controller';
import { ProfileService } from './services/profile.service';

@Module({
  imports: [UserModule, AuthModule, AuditModule, UploadModule],
  controllers: [ProfileController, PublicProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
