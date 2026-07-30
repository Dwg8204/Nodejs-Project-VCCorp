import { Controller, Get, MessageEvent, Query, Sse, UseGuards } from '@nestjs/common';
import { DashboardService } from '../services/dashboardService';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'modules/auth/guards/roles.guard';
import { Roles } from 'modules/auth/decorators/roles.decorator';
import { RoleName } from 'common/enums/database.enums';
import { InteractionRealtimeService } from 'modules/interaction/services/interaction-realtime.service';
import { map, Observable } from 'rxjs';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly realtime: InteractionRealtimeService,
  ) {}

  @Get()
  getStats(@Query('period') period?: string) {
    return this.dashboardService.getStats(Number(period ?? 30));
  }

  @Sse('events')
  events(): Observable<MessageEvent> {
    return this.realtime.stream().pipe(map((event) => ({ data: event })));
  }
}
