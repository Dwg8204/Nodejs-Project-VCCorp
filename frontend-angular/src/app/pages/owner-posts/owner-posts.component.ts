import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { PostStatus } from '../../data/mock/mock-schema.model';

interface OwnerPost { id:number; title:string; category:string; languages:string[]; status:PostStatus; date:string; rejectionReason:string|null; }

@Component({selector:'app-owner-posts',standalone:true,imports:[RouterLink],templateUrl:'./owner-posts.component.html',styleUrl:'./owner-posts.component.scss',changeDetection:ChangeDetectionStrategy.OnPush,encapsulation:ViewEncapsulation.None,schemas:[CUSTOM_ELEMENTS_SCHEMA]})
export class OwnerPostsComponent {
  private readonly database=inject(MockDatabaseService); protected readonly auth=inject(AuthService); protected readonly language=inject(LanguageService);
  protected readonly search=signal(''); protected readonly status=signal(''); protected readonly sort=signal('newest'); protected readonly page=signal(1); protected readonly pageSize=5;
  protected readonly allPosts=computed<OwnerPost[]>(()=>{const userId=this.auth.currentUser()?.id;const languageId=this.language.locale()==='vi'?2:1;const translations=this.database.table('post_translations');const categoryTranslations=this.database.table('category_translation');const languages=this.database.table('languages');return this.database.table('posts').filter(post=>post.author_id===userId&&!post.deleted_at).map(post=>({id:post.id,title:translations.find(t=>t.post_id===post.id&&t.language_id===languageId)?.title??translations.find(t=>t.post_id===post.id)?.title??'Untitled',category:categoryTranslations.find(t=>t.category_id===post.category_id&&t.language_id===languageId)?.name??'Unknown',languages:translations.filter(t=>t.post_id===post.id).map(t=>languages.find(l=>l.id===t.language_id)?.code.toUpperCase()??String(t.language_id)),status:post.status,date:post.created_at,rejectionReason:post.rejection_reason}));});
  protected readonly stats=computed(()=>{const rows=this.allPosts();return [{vi:'Tổng bài viết',en:'Total Posts',value:rows.length,danger:false},{vi:'Bản nháp',en:'Drafts',value:rows.filter(p=>p.status==='DRAFT').length,danger:false},{vi:'Đã xuất bản',en:'Published',value:rows.filter(p=>p.status==='PUBLISHED').length,danger:false},{vi:'Chờ duyệt',en:'Pending',value:rows.filter(p=>p.status==='PENDING').length,danger:false},{vi:'Bị từ chối',en:'Rejected',value:rows.filter(p=>p.status==='REJECTED').length,danger:true}];});
  protected readonly filtered=computed(()=>{const q=this.search().trim().toLocaleLowerCase();const rows=this.allPosts().filter(p=>(!q||p.title.toLocaleLowerCase().includes(q)||p.category.toLocaleLowerCase().includes(q))&&(!this.status()||p.status===this.status()));return rows.sort((a,b)=>this.sort()==='oldest'?+new Date(a.date)-+new Date(b.date):this.sort()==='title-asc'?a.title.localeCompare(b.title):this.sort()==='title-desc'?b.title.localeCompare(a.title):+new Date(b.date)-+new Date(a.date));});
  protected readonly pages=computed(()=>Array.from({length:Math.max(1,Math.ceil(this.filtered().length/this.pageSize))},(_,i)=>i+1));
  protected readonly visible=computed(()=>this.filtered().slice((this.page()-1)*this.pageSize,this.page()*this.pageSize));
  protected label(row:{vi:string;en:string}):string{return this.language.locale()==='vi'?row.vi:row.en;}
  protected setFilter(target:'search'|'status'|'sort',value:string):void{if(target==='search')this.search.set(value);if(target==='status')this.status.set(value);if(target==='sort')this.sort.set(value);this.page.set(1);}
  protected statusLabel(status:PostStatus):string{const vi={DRAFT:'Bản nháp',PUBLISHED:'Đã xuất bản',PENDING:'Chờ duyệt',REJECTED:'Bị từ chối'};const en={DRAFT:'Draft',PUBLISHED:'Published',PENDING:'Pending',REJECTED:'Rejected'};return (this.language.locale()==='vi'?vi:en)[status];}
  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.locale()==='vi'?'vi-VN':'en-US').format(new Date(value));}
  protected deletePost(id:number):void{this.database.write('posts',this.database.table('posts').filter(row=>row.id!==id));this.database.write('post_translations',this.database.table('post_translations').filter(row=>row.post_id!==id));}
}
