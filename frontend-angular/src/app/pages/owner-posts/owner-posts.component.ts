import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, HostListener, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPost } from '../../core/models/content.model';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { NotificationService } from '../../core/services/notification.service';
import { OwnerPostsApiService, OwnerPostStats } from '../../core/services/owner-posts-api.service';

type PostStatus='DRAFT'|'PENDING'|'PUBLISHED'|'REJECTED';
interface OwnerPost { id:number; title:string; content:string; thumbnail:string; category:string; languages:string[]; status:PostStatus; date:string; rejectionReason:string|null; }
interface PostPreview extends OwnerPost { author:string; }

@Component({selector:'app-owner-posts',standalone:true,imports:[RouterLink],templateUrl:'./owner-posts.component.html',styleUrl:'./owner-posts.component.scss',changeDetection:ChangeDetectionStrategy.OnPush,encapsulation:ViewEncapsulation.None,schemas:[CUSTOM_ELEMENTS_SCHEMA]})
export class OwnerPostsComponent {
  private readonly api=inject(OwnerPostsApiService);
  private readonly notifications=inject(NotificationService);
  protected readonly auth=inject(AuthService);
  protected readonly language=inject(LanguageService);
  protected readonly previewId=signal<number|null>(null);
  protected readonly search=signal('');
  protected readonly status=signal('');
  protected readonly sort=signal('newest');
  protected readonly page=signal(1);
  protected readonly pageSize=5;
  protected readonly allPosts=signal<OwnerPost[]>([]);
  protected readonly totalPages=signal(1);
  protected readonly serverStats=signal<OwnerPostStats>({total:0,DRAFT:0,PENDING:0,PUBLISHED:0,REJECTED:0});
  protected readonly visible=computed(()=>this.allPosts());
  protected readonly pages=computed(()=>Array.from({length:this.totalPages()},(_,index)=>index+1));
  protected readonly stats=computed(()=>{const value=this.serverStats();return [{vi:'Tổng bài viết',en:'Total Posts',value:value.total,danger:false},{vi:'Bản nháp',en:'Drafts',value:value.DRAFT,danger:false},{vi:'Đã xuất bản',en:'Published',value:value.PUBLISHED,danger:false},{vi:'Chờ duyệt',en:'Pending',value:value.PENDING,danger:false},{vi:'Bị từ chối',en:'Rejected',value:value.REJECTED,danger:true}];});
  protected readonly previewPost=computed<PostPreview|null>(()=>{const post=this.allPosts().find(item=>item.id===this.previewId());if(!post)return null;const user=this.auth.currentUser();return{...post,author:user?.fullName||user?.userName||'Anonymous'};});

  constructor(){
    effect(()=>{this.language.locale();this.loadPosts(this.page(),this.search(),this.status(),this.sort());},{allowSignalWrites:true});
  }

  protected label(row:{vi:string;en:string}):string{return this.language.choose(row.vi,row.en);}
  protected setFilter(target:'search'|'status'|'sort',value:string):void{if(target==='search')this.search.set(value);if(target==='status')this.status.set(value);if(target==='sort')this.sort.set(value);this.page.set(1);}
  protected goToPage(value:number):void{this.page.set(value);}
  protected statusLabel(status:PostStatus):string{const vi={DRAFT:'Bản nháp',PUBLISHED:'Đã xuất bản',PENDING:'Chờ duyệt',REJECTED:'Bị từ chối'};const en={DRAFT:'Draft',PUBLISHED:'Published',PENDING:'Pending',REJECTED:'Rejected'};return this.language.chooseObject(vi,en)[status];}
  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale()).format(new Date(value));}
  protected deletePost(id:number):void{this.api.delete(String(id)).subscribe({next:()=>{this.notifications.success('Đã xóa bài viết.','Post deleted.');if(this.allPosts().length===1&&this.page()>1)this.page.update(value=>value-1);else this.loadPosts(this.page(),this.search(),this.status(),this.sort());},error:error=>this.notifications.fromApi(error)});}
  @HostListener('click',['$event']) protected openPreview(event:MouseEvent):void{const button=(event.target as HTMLElement).closest('.view-btn,.post-title-cell');if(!button)return;const row=button.closest('tr');const body=row?.parentElement;if(!row||!body)return;const index=Array.from(body.children).indexOf(row);const post=this.visible()[index];if(post)this.previewId.set(post.id);}
  protected closePreview():void{this.previewId.set(null);}

  private loadPosts(page:number,search:string,status:string,sort:string):void{
    this.api.list({page,limit:this.pageSize,search:search.trim()||undefined,status:status||undefined,sort}).subscribe({
      next:response=>{
        this.allPosts.set(response.data.items.map(post=>this.mapPost(post)));
        this.serverStats.set(response.data.stats);
        this.totalPages.set(Math.max(1,response.data.pagination.totalPages));
        if(page>Math.max(1,response.data.pagination.totalPages))this.page.set(Math.max(1,response.data.pagination.totalPages));
      },
      error:error=>{this.allPosts.set([]);this.notifications.fromApi(error);},
    });
  }
  private mapPost(post:ContentPost):OwnerPost{
    const translation=post.translations.find(item=>item.languageId===this.language.languageId())??post.translations[0];
    const category=post.category?.translations.find(item=>item.languageId===this.language.languageId())??post.category?.translations[0];
    const languageCodes=post.translations.map(item=>this.language.availableLanguages().find(language=>language.id===item.languageId)?.code.toUpperCase()??String(item.languageId));
    return{id:Number(post.id),title:translation?.title??'Untitled',content:translation?.content??'',thumbnail:post.thumbnail,category:category?.name??'',languages:languageCodes,status:post.status,date:post.createdAt,rejectionReason:post.rejectionReason};
  }
}
