import { inject, Injectable } from '@angular/core';
import { PaginatedData } from '../models/api.model';
import { ApiClientService, ApiQuery } from './api-client.service';

export interface AuditLogListItem {
  id:string; actorId:number|null; actorName:string|null; actorRole:string|null;
  action:string; entityType:string; entityId:string|null; entityLabel:string|null;
  ipAddress:string|null; createdAt:string;
}
export interface AuditLogDetail extends AuditLogListItem {
  beforeData:unknown; afterData:unknown; metadata:unknown; userAgent:string|null;
}
export interface AuditFilterOptions {
  actions:string[]; entityTypes:string[];
  actors:{id:number;name:string|null;role:string|null}[];
}

@Injectable({providedIn:'root'})
export class AdminAuditLogsApiService {
  private readonly api=inject(ApiClientService);
  list(query:ApiQuery){return this.api.get<PaginatedData<AuditLogListItem>>('admin/logs',{query});}
  filterOptions(){return this.api.get<AuditFilterOptions>('admin/logs/filter-options');}
  detail(id:string){return this.api.get<{log:AuditLogDetail}>(`admin/logs/${id}`);}
}
