import { inject, Injectable } from '@angular/core';
import { ApiClientService } from './api-client.service';

export interface DashboardData {
  period:number;
  stats:{posts:number;users:number;categories:number;languages:number;likes:number;comments:number;engagementPerPost:number};
  postStatus:Record<'DRAFT'|'PENDING'|'PUBLISHED'|'REJECTED',number>;
  engagementTrend:{date:string;likes:number;comments:number}[];
  topPosts:Array<{id:string;translations:Array<{languageId:number;title:string}>;likesCount:number;commentsCount:number}>;
  contentByCategory:Array<{categoryId:number;languageId:number;name:string;postsCount:number}>;
  translationCoverage:Array<{languageId:number;total:number;autoTranslated:number}>;
  recentActivity:Array<{action:string;entityType:string;entityId:string|null;entityLabel:string|null;createdAt:string}>;
}

@Injectable({providedIn:'root'})
export class DashboardApiService {
  private readonly api=inject(ApiClientService);
  get(period:number){return this.api.get<DashboardData>('admin/dashboard',{query:{period}});}
}
