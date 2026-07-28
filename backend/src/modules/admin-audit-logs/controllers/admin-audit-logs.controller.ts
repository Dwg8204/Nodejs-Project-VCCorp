import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from 'common/enums/database.enums';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { AdminAuditLogsService } from '../services/admin-audit-logs.service';
import { QueryAdminAuditLogsDto } from '../validations/admin-audit-logs.validation';

@Controller('admin/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
export class AdminAuditLogsController {
  constructor(
    private readonly adminAuditLogsService: AdminAuditLogsService,
  ) {}

  @Get()
  findAll(@Query() dto: QueryAdminAuditLogsDto) {
    return this.adminAuditLogsService.findAll(dto);
  }

  @Get('filter-options')
  filterOptions() {
    return this.adminAuditLogsService.filterOptions();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminAuditLogsService.findOne(id);
  }
}
