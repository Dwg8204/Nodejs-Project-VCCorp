import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, inject, Injector, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAuditLogsApiService, AuditLogDetail, AuditLogListItem } from '../../core/services/admin-audit-logs-api.service';
import { LanguageService } from '../../core/services/language.service';
import { NotificationService } from '../../core/services/notification.service';
import { buildPaginationItems } from '../../shared/utils/pagination';
import { bindQueryState, positiveInteger } from '../../shared/utils/query-state';

interface AuditLogView {
  id:string;actor_name:string|null;actor_role:string|null;action:string;entity_type:string;entity_id:string|null;
  entity_label:string|null;ip_address:string|null;created_at:string;before_data:unknown;after_data:unknown;metadata:unknown;user_agent:string|null;
}
const ACTIONS:Record<string,{vi:string;en:string}>={
  POST_CREATED:{vi:'Tạo bài viết',en:'Post created'},POST_UPDATED:{vi:'Sửa bài viết',en:'Post updated'},POST_SUBMITTED:{vi:'Gửi bài duyệt',en:'Post submitted'},POST_APPROVED:{vi:'Duyệt bài viết',en:'Post approved'},POST_REJECTED:{vi:'Từ chối bài viết',en:'Post rejected'},POST_DELETED:{vi:'Xóa bài viết',en:'Post deleted'},
  CATEGORY_CREATED:{vi:'Tạo danh mục',en:'Category created'},CATEGORY_UPDATED:{vi:'Sửa danh mục',en:'Category updated'},CATEGORY_TRANSLATED:{vi:'Dịch danh mục',en:'Category translated'},CATEGORY_DELETED:{vi:'Xóa danh mục',en:'Category deleted'},
  USER_CREATED:{vi:'Tạo người dùng',en:'User created'},USER_LOCKED:{vi:'Khóa người dùng',en:'User locked'},USER_UNLOCKED:{vi:'Mở khóa người dùng',en:'User unlocked'},USER_ROLE_CHANGED:{vi:'Đổi vai trò',en:'Role changed'},
  LANGUAGE_CREATED:{vi:'Thêm ngôn ngữ',en:'Language created'},LANGUAGE_UPDATED:{vi:'Sửa ngôn ngữ',en:'Language updated'},LANGUAGE_DELETED:{vi:'Xóa ngôn ngữ',en:'Language deleted'},LANGUAGE_DEFAULT_CHANGED:{vi:'Đổi ngôn ngữ mặc định',en:'Default language changed'},
  AUTH_LOGIN_SUCCEEDED:{vi:'Đăng nhập thành công',en:'Login succeeded'},AUTH_LOGIN_FAILED:{vi:'Đăng nhập thất bại',en:'Login failed'},AUTH_LOGOUT:{vi:'Đăng xuất',en:'Logout'},AUTH_ACCESS_DENIED:{vi:'Truy cập bị từ chối',en:'Access denied'},
  PROFILE_UPDATED:{vi:'Cập nhật hồ sơ',en:'Profile updated'},PROFILE_AVATAR_UPDATED:{vi:'Cập nhật ảnh đại diện',en:'Avatar updated'},PROFILE_COVER_UPDATED:{vi:'Cập nhật ảnh bìa',en:'Cover updated'},
};
const localDateValue=(date:Date):string=>{
  const year=date.getFullYear();
  const month=String(date.getMonth()+1).padStart(2,'0');
  const day=String(date.getDate()).padStart(2,'0');
  return `${year}-${month}-${day}`;
};

@Component({selector:'app-admin-logs',standalone:true,templateUrl:'./admin-logs.component.html',styleUrl:'./admin-logs.component.scss',changeDetection:ChangeDetectionStrategy.OnPush,encapsulation:ViewEncapsulation.None,schemas:[CUSTOM_ELEMENTS_SCHEMA]})
export class AdminLogsComponent {
  private readonly api=inject(AdminAuditLogsApiService);private readonly notifications=inject(NotificationService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);private readonly injector=inject(Injector);private readonly destroyRef=inject(DestroyRef);
  protected readonly language=inject(LanguageService);
  protected readonly search=signal('');protected readonly action=signal('');protected readonly dateFrom=signal('');protected readonly dateTo=signal('');
  protected readonly page=signal(1);protected readonly pageSize=signal(5);protected readonly pageInput=signal(1);protected readonly sizeInput=signal(5);
  protected readonly detail=signal<AuditLogView|null>(null);protected readonly logs=signal<AuditLogView[]>([]);protected readonly total=signal(0);protected readonly totalPages=signal(1);
  protected readonly dateError=signal('');protected readonly maxDate=localDateValue(new Date());
  protected readonly actionOptions=signal<string[]>([]);
  protected readonly filtered=computed(()=>this.logs());protected readonly visible=computed(()=>this.logs());
  protected readonly pages=computed(()=>buildPaginationItems(this.page(),this.totalPages()));
  protected readonly summary=computed(()=>{const total=this.total(),from=total?(this.page()-1)*this.pageSize()+1:0,to=Math.min(this.page()*this.pageSize(),total);return this.language.translate('pagination.summary',{from,to,total});});

  constructor(){bindQueryState(this.route,this.router,this.injector,this.destroyRef,{q:{signal:this.search,defaultValue:''},action:{signal:this.action,defaultValue:''},from:{signal:this.dateFrom,defaultValue:''},to:{signal:this.dateTo,defaultValue:''},page:{signal:this.page,defaultValue:1,parse:positiveInteger(1)},limit:{signal:this.pageSize,defaultValue:5,parse:positiveInteger(5,100)}});this.normalizeDateFilters();this.pageInput.set(this.page());this.sizeInput.set(this.pageSize());this.loadOptions();effect(()=>this.load(this.page(),this.pageSize(),this.search(),this.action(),this.dateFrom(),this.dateTo()),{allowSignalWrites:true});}
  protected update(kind:'search'|'action',value:string):void{if(kind==='search')this.search.set(value);if(kind==='action')this.action.set(value);this.changePage(1);}
  protected updateDate(kind:'from'|'to',input:HTMLInputElement):void{const value=input.value;const from=kind==='from'?value:this.dateFrom();const to=kind==='to'?value:this.dateTo();const error=this.dateValidationError(from,to);if(error){this.dateError.set(error);input.value=kind==='from'?this.dateFrom():this.dateTo();return;}this.dateError.set('');if(kind==='from')this.dateFrom.set(value);else this.dateTo.set(value);this.changePage(1);}
  protected reset():void{this.search.set('');this.action.set('');this.dateFrom.set('');this.dateTo.set('');this.dateError.set('');this.changePage(1);}
  protected actionText(action:string):string{const item=ACTIONS[action];return item?this.language.choose(item.vi,item.en):action.replaceAll('_',' ');}
  protected actor(row:AuditLogView):string{return row.actor_name??this.language.choose('Hệ thống / Khách','System / Guest');}
  protected target(row:AuditLogView):string{return row.entity_label??`#${row.entity_id??'—'}`;}
  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale(),{dateStyle:'short',timeStyle:'short'}).format(new Date(value));}
  protected json(value:unknown):string{return JSON.stringify(value,null,2);}
  protected changePage(value:number):void{const next=Math.min(Math.max(1,value),this.totalPages());this.page.set(next);this.pageInput.set(next);document.querySelector('.audit-filter-row')?.scrollIntoView({behavior:'smooth',block:'start'});}
  protected applyPage():void{this.changePage(this.pageInput());}
  protected applyPageSize():void{const size=Math.min(100,Math.max(1,Math.trunc(this.sizeInput()||1)));this.pageSize.set(size);this.sizeInput.set(size);this.changePage(1);}
  protected openDetail(row:AuditLogView):void{this.api.detail(row.id).subscribe({next:({data})=>this.detail.set(this.mapDetail(data.log)),error:error=>this.notifications.fromApi(error)});}
  protected getDiff(before:unknown,after:unknown):{key:string,beforeVal:string,afterVal:string,changed:boolean}[]{const object=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value);if(!object(before)&&!object(after))return[];const left=object(before)?before:{},right=object(after)?after:{};return[...new Set([...Object.keys(left),...Object.keys(right)])].map(key=>({key,beforeVal:left[key]!==undefined?this.display(left[key]):'—',afterVal:right[key]!==undefined?this.display(right[key]):'—',changed:JSON.stringify(left[key]??null)!==JSON.stringify(right[key]??null)}));}
  private load(page:number,limit:number,search:string,action:string,fromDate:string,toDate:string):void{this.api.list({page,limit,search:search.trim()||undefined,action:action||undefined,fromDate:fromDate||undefined,toDate:toDate||undefined,sort:'newest'}).subscribe({next:({data})=>{this.logs.set(data.items.map(item=>this.mapList(item)));this.total.set(data.pagination.total);this.totalPages.set(Math.max(1,data.pagination.totalPages));if(page>Math.max(1,data.pagination.totalPages))this.changePage(Math.max(1,data.pagination.totalPages));},error:error=>{this.logs.set([]);this.total.set(0);this.notifications.fromApi(error);}});}
  private loadOptions():void{this.api.filterOptions().subscribe({next:({data})=>this.actionOptions.set(data.actions.sort((a,b)=>this.actionText(a).localeCompare(this.actionText(b),this.language.formatLocale()))),error:error=>this.notifications.fromApi(error)});}
  private mapList(item:AuditLogListItem):AuditLogView{return{id:item.id,actor_name:item.actorName,actor_role:item.actorRole,action:item.action,entity_type:item.entityType,entity_id:item.entityId,entity_label:item.entityLabel,ip_address:item.ipAddress,created_at:item.createdAt,before_data:null,after_data:null,metadata:null,user_agent:null};}
  private mapDetail(item:AuditLogDetail):AuditLogView{return{...this.mapList(item),before_data:item.beforeData,after_data:item.afterData,metadata:item.metadata,user_agent:item.userAgent};}
  private normalizeDateFilters():void{const error=this.dateValidationError(this.dateFrom(),this.dateTo());if(!error)return;this.dateFrom.set('');this.dateTo.set('');this.dateError.set(error);}
  private dateValidationError(from:string,to:string):string{if((from&&from>this.maxDate)||(to&&to>this.maxDate))return this.language.choose('Không được chọn ngày trong tương lai.','Future dates are not allowed.');if(from&&to&&from>to)return this.language.choose('Từ ngày không được sau Đến ngày.','From date cannot be after To date.');return '';}
  private display(value:unknown):string{return typeof value==='object'&&value!==null?JSON.stringify(value):String(value);}
}
