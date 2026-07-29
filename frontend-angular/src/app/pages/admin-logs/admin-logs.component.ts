import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, ViewEncapsulation } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';
import { AuditLogRow } from '../../data/mock/mock-schema.model';
import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { buildPaginationItems } from '../../shared/utils/pagination';

const ACTIONS: Record<string, { vi: string; en: string }> = {
  POST_CREATED:{vi:'Tạo bài viết',en:'Post created'},POST_UPDATED:{vi:'Sửa bài viết',en:'Post updated'},POST_SUBMITTED:{vi:'Gửi bài duyệt',en:'Post submitted'},POST_APPROVED:{vi:'Duyệt bài viết',en:'Post approved'},POST_REJECTED:{vi:'Từ chối bài viết',en:'Post rejected'},POST_DELETED:{vi:'Xóa bài viết',en:'Post deleted'},
  CATEGORY_CREATED:{vi:'Tạo danh mục',en:'Category created'},CATEGORY_UPDATED:{vi:'Sửa danh mục',en:'Category updated'},CATEGORY_TRANSLATED:{vi:'Dịch danh mục',en:'Category translated'},CATEGORY_DELETED:{vi:'Xóa danh mục',en:'Category deleted'},
  USER_CREATED:{vi:'Tạo người dùng',en:'User created'},USER_LOCKED:{vi:'Khóa người dùng',en:'User locked'},USER_UNLOCKED:{vi:'Mở khóa người dùng',en:'User unlocked'},USER_ROLE_CHANGED:{vi:'Đổi vai trò',en:'Role changed'},
  LANGUAGE_CREATED:{vi:'Thêm ngôn ngữ',en:'Language created'},LANGUAGE_UPDATED:{vi:'Sửa ngôn ngữ',en:'Language updated'},LANGUAGE_DELETED:{vi:'Xóa ngôn ngữ',en:'Language deleted'},LANGUAGE_DEFAULT_CHANGED:{vi:'Đổi ngôn ngữ mặc định',en:'Default language changed'},
  SETTINGS_UPDATED:{vi:'Thay đổi cài đặt',en:'Settings updated'},SETTINGS_RESTORED:{vi:'Khôi phục cài đặt',en:'Settings restored'},
  AUTH_LOGIN_SUCCEEDED:{vi:'Đăng nhập thành công',en:'Login succeeded'},AUTH_LOGIN_FAILED:{vi:'Đăng nhập thất bại',en:'Login failed'},AUTH_LOGOUT:{vi:'Đăng xuất',en:'Logout'},AUTH_ACCESS_DENIED:{vi:'Truy cập bị từ chối',en:'Access denied'},
};

@Component({
  selector:'app-admin-logs', standalone:true, templateUrl:'./admin-logs.component.html',
  styleUrl:'./admin-logs.component.scss', changeDetection:ChangeDetectionStrategy.OnPush,
  encapsulation:ViewEncapsulation.None, schemas:[CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminLogsComponent {
  private readonly database=inject(MockDatabaseService);
  protected readonly language=inject(LanguageService);
  protected readonly search=signal(''); protected readonly action=signal(''); protected readonly entity=signal('');
  protected readonly dateFrom=signal(''); protected readonly dateTo=signal('');
  protected readonly page=signal(1); protected readonly pageSize=signal(5); protected readonly pageInput=signal(1); protected readonly sizeInput=signal(5);
  protected readonly detail=signal<AuditLogRow|null>(null);
  protected readonly logs=computed(()=>this.database.table('audit_logs').sort((a,b)=>+new Date(b.created_at)-+new Date(a.created_at)));
  protected readonly actionOptions=computed(()=>[...new Set([...Object.keys(ACTIONS),...this.logs().map(row=>row.action)])].sort((a,b)=>this.actionText(a).localeCompare(this.actionText(b),this.language.formatLocale())));
  protected readonly entityOptions=computed(()=>[...new Set(['POST','CATEGORY','USER','LANGUAGE','SETTINGS','AUTH','PAGE',...this.logs().map(row=>row.entity_type)])]);
  protected readonly filtered=computed(()=>{
    const query=this.search().trim().toLocaleLowerCase(); const from=this.dateFrom(); const to=this.dateTo();
    return this.logs().filter(row=>{
      const haystack=`${row.actor_name??''} ${row.entity_label??''} ${row.action} ${row.entity_type}`.toLocaleLowerCase();
      const date=row.created_at.slice(0,10);
      return (!query||haystack.includes(query))&&(!this.action()||row.action===this.action())&&(!this.entity()||row.entity_type===this.entity())&&(!from||date>=from)&&(!to||date<=to);
    });
  });
  protected readonly totalPages=computed(()=>Math.max(1,Math.ceil(this.filtered().length/this.pageSize())));
  protected readonly pages=computed(()=>buildPaginationItems(this.page(),this.totalPages()));
  protected readonly visible=computed(()=>this.filtered().slice((this.page()-1)*this.pageSize(),this.page()*this.pageSize()));
  protected readonly summary=computed(()=>{const total=this.filtered().length;const from=total?(this.page()-1)*this.pageSize()+1:0;const to=Math.min(this.page()*this.pageSize(),total);return this.language.translate('pagination.summary',{from,to,total});});

  protected update(kind:'search'|'action'|'entity'|'from'|'to',value:string):void {
    if(kind==='search')this.search.set(value);if(kind==='action')this.action.set(value);if(kind==='entity')this.entity.set(value);if(kind==='from')this.dateFrom.set(value);if(kind==='to')this.dateTo.set(value);this.changePage(1);
  }
  protected reset():void {this.search.set('');this.action.set('');this.entity.set('');this.dateFrom.set('');this.dateTo.set('');this.changePage(1);}
  protected actionText(action:string):string {const item=ACTIONS[action];return item?this.language.choose(item.vi,item.en):action.replaceAll('_',' ');}
  protected actor(row:AuditLogRow):string{return row.actor_name??this.language.choose('Hệ thống / Khách','System / Guest');}
  protected target(row:AuditLogRow):string{return row.entity_label??`#${row.entity_id??'—'}`;}
  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale(),{dateStyle:'short',timeStyle:'short'}).format(new Date(value));}
  protected json(value:unknown):string{return JSON.stringify(value,null,2);}
  protected changePage(value:number):void {const next=Math.min(Math.max(1,value),this.totalPages());this.page.set(next);this.pageInput.set(next);document.querySelector('.audit-filter-row')?.scrollIntoView({behavior:'smooth',block:'start'});}
  protected applyPage():void{this.changePage(this.pageInput());}
  protected applyPageSize():void{const size=Math.min(100,Math.max(1,Math.trunc(this.sizeInput()||1)));this.pageSize.set(size);this.sizeInput.set(size);this.changePage(1);}

  protected getDiff(before: unknown, after: unknown): { key: string, beforeVal: string, afterVal: string, changed: boolean }[] {
    const isObject = (val: unknown): val is Record<string, unknown> => val !== null && typeof val === 'object' && !Array.isArray(val);
    if (!isObject(before) && !isObject(after)) return [];

    const beforeObj = isObject(before) ? before : {};
    const afterObj = isObject(after) ? after : {};
    const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
    const diff: { key: string, beforeVal: string, afterVal: string, changed: boolean }[] = [];

    for (const key of keys) {
      const bVal = JSON.stringify(beforeObj[key] ?? null);
      const aVal = JSON.stringify(afterObj[key] ?? null);
      diff.push({
        key,
        beforeVal: beforeObj[key] !== undefined ? String(beforeObj[key]) : '—',
        afterVal: afterObj[key] !== undefined ? String(afterObj[key]) : '—',
        changed: bVal !== aVal
      });
    }
    return diff;
  }
}
