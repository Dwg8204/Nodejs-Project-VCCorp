import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboardService';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { RoleName } from 'common/enums/database.enums';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getStats() {
    return this.dashboardService.getStats();
  }
}
