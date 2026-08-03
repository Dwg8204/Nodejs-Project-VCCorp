import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, HostListener, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentPost } from '../../core/models/content.model';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { NotificationService } from '../../core/services/notification.service';
import { OwnerPostsApiService, OwnerPostStats } from '../../core/services/owner-posts-api.service';
import { buildPaginationItems } from '../../shared/utils/pagination';

type PostStatus='DRAFT'|'PENDING'|'PUBLISHED'|'REJECTED';
interface PostLanguageBadge { code:string;name:string;flag:string|null; }
interface OwnerPost { id:number; title:string; content:string; thumbnail:string; category:string; languages:PostLanguageBadge[]; status:PostStatus; date:string; rejectionReason:string|null; }
interface PostPreview extends OwnerPost { author:string; }

@Component({selector:'app-owner-posts',standalone:true,imports:[RouterLink],templateUrl:'./owner-posts.component.html',styleUrl:'./owner-posts.component.scss',changeDetection:ChangeDetectionStrategy.OnPush,encapsulation:ViewEncapsulation.None,schemas:[CUSTOM_ELEMENTS_SCHEMA]})
export class OwnerPostsComponent {
  private readonly api=inject(OwnerPostsApiService);
  private readonly notifications=inject(NotificationService);
  protected readonly auth=inject(AuthService);
  protected readonly language=inject(LanguageService);
  protected readonly previewId=signal<number|null>(null);
  protected readonly openLanguagesId=signal<number|null>(null);
  protected readonly search=signal('');
  protected readonly status=signal('');
  protected readonly sort=signal('newest');
  protected readonly page=signal(1);
  protected readonly pageSize=signal(5);
  protected readonly pageInput=signal(1);
  protected readonly sizeInput=signal(5);
  protected readonly allPosts=signal<OwnerPost[]>([]);
  protected readonly total=signal(0);
  protected readonly totalPages=signal(1);
  protected readonly serverStats=signal<OwnerPostStats>({total:0,DRAFT:0,PENDING:0,PUBLISHED:0,REJECTED:0});
  protected readonly visible=computed(()=>this.allPosts());
  protected readonly pages=computed(()=>buildPaginationItems(this.page(),this.totalPages()));
  protected readonly summary=computed(()=>{const total=this.total();const from=total?(this.page()-1)*this.pageSize()+1:0;const to=Math.min(this.page()*this.pageSize(),total);return this.language.translate('pagination.summary',{from,to,total});});
  protected readonly stats=computed(()=>{const value=this.serverStats();return [{vi:'Tổng bài viết',en:'Total Posts',value:value.total,danger:false},{vi:'Bản nháp',en:'Drafts',value:value.DRAFT,danger:false},{vi:'Đã xuất bản',en:'Published',value:value.PUBLISHED,danger:false},{vi:'Chờ duyệt',en:'Pending',value:value.PENDING,danger:false},{vi:'Bị từ chối',en:'Rejected',value:value.REJECTED,danger:true}];});
  protected readonly previewPost=computed<PostPreview|null>(()=>{const post=this.allPosts().find(item=>item.id===this.previewId());if(!post)return null;const user=this.auth.currentUser();return{...post,author:user?.fullName||user?.userName||'Anonymous'};});

  constructor(){
    effect(()=>{this.language.locale();this.loadPosts(this.page(),this.search(),this.status(),this.sort());},{allowSignalWrites:true});
  }

  protected label(row:{vi:string;en:string}):string{return this.language.choose(row.vi,row.en);}
  protected setFilter(target:'search'|'status'|'sort',value:string):void{if(target==='search')this.search.set(value);if(target==='status')this.status.set(value);if(target==='sort')this.sort.set(value);this.page.set(1);this.pageInput.set(1);}
  protected goToPage(value:number):void{const next=Math.min(Math.max(1,value),this.totalPages());this.page.set(next);this.pageInput.set(next);}
  protected applyPage():void{this.goToPage(this.pageInput());}
  protected applyPageSize():void{const size=Math.min(100,Math.max(1,Math.trunc(this.sizeInput()||1)));this.pageSize.set(size);this.sizeInput.set(size);this.goToPage(1);}
  protected statusLabel(status:PostStatus):string{const vi={DRAFT:'Bản nháp',PUBLISHED:'Đã xuất bản',PENDING:'Chờ duyệt',REJECTED:'Bị từ chối'};const en={DRAFT:'Draft',PUBLISHED:'Published',PENDING:'Pending',REJECTED:'Rejected'};return this.language.chooseObject(vi,en)[status];}
  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale()).format(new Date(value));}
  protected deletePost(id:number):void{this.api.delete(String(id)).subscribe({next:()=>{this.notifications.success('Đã xóa bài viết.','Post deleted.');if(this.allPosts().length===1&&this.page()>1)this.page.update(value=>value-1);else this.loadPosts(this.page(),this.search(),this.status(),this.sort());},error:error=>this.notifications.fromApi(error)});}
  protected toggleLanguages(event:MouseEvent,id:number):void{event.stopPropagation();this.openLanguagesId.update(value=>value===id?null:id);}
  @HostListener('document:click') protected closeLanguages():void{this.openLanguagesId.set(null);}
  @HostListener('click',['$event']) protected openPreview(event:MouseEvent):void{const button=(event.target as HTMLElement).closest('.view-btn,.post-title-cell');if(!button)return;const row=button.closest('tr');const body=row?.parentElement;if(!row||!body)return;const index=Array.from(body.children).indexOf(row);const post=this.visible()[index];if(post)this.previewId.set(post.id);}
  protected closePreview():void{this.previewId.set(null);}

  private loadPosts(page:number,search:string,status:string,sort:string):void{
    this.api.list({page,limit:this.pageSize(),search:search.trim()||undefined,status:status||undefined,sort}).subscribe({
      next:response=>{
        this.allPosts.set(response.data.items.map(post=>this.mapPost(post)));
        this.serverStats.set(response.data.stats);
        this.total.set(response.data.pagination.total);
        this.totalPages.set(Math.max(1,response.data.pagination.totalPages));
        if(page>Math.max(1,response.data.pagination.totalPages))this.page.set(Math.max(1,response.data.pagination.totalPages));
      },
      error:error=>{this.allPosts.set([]);this.total.set(0);this.totalPages.set(1);this.notifications.fromApi(error);},
    });
  }
  private mapPost(post:ContentPost):OwnerPost{
    const translation=post.translations.find(item=>item.languageId===this.language.languageId())??post.translations[0];
    const category=post.category?.translations.find(item=>item.languageId===this.language.languageId())??post.category?.translations[0];
    const languageBadges=post.translations.map(item=>{const language=this.language.availableLanguages().find(row=>row.id===item.languageId);return{code:language?.code.toUpperCase()??String(item.languageId),name:language?.name??String(item.languageId),flag:language?.flag??null};});
    return{id:Number(post.id),title:translation?.title??'Untitled',content:translation?.content??'',thumbnail:post.thumbnail,category:category?.name??'',languages:languageBadges,status:post.status,date:post.createdAt,rejectionReason:post.rejectionReason};
  }
}
