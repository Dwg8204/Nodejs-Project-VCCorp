import { Module } from '@nestjs/common';
import { AuditModule } from 'modules/audit/audit.module';
import { AuthModule } from 'modules/auth/auth.module';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminAuditLogsService } from './services/admin-audit-logs.service';

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [AdminAuditLogsController],
  providers: [AdminAuditLogsService],
})
export class AdminAuditLogsModule {}
