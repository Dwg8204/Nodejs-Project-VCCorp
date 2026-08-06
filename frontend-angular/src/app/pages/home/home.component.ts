import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, HostListener, inject, Injector, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContentCategory, ContentPost } from '../../core/models/content.model';
import { AuthService } from '../../core/services/auth.service';
import { ContentApiService } from '../../core/services/content-api.service';
import { FeedUiService } from '../../core/services/feed-ui.service';
import { LanguageService } from '../../core/services/language.service';
import { buildPaginationItems } from '../../shared/utils/pagination';
import { bindQueryState, positiveInteger } from '../../shared/utils/query-state';

interface FeedPost { id:number; authorId:number; categoryId:number; title:string; content:string; authorName:string; authorAvatar:string; categoryName:string; thumbnail:string; createdAt:string; likes:number; comments:number; isLiked:boolean; }
interface FeedCategory { id:number|'all'; name:string; }
interface AuthorHover { name:string; avatar:string; posts:number; likes:number; }

@Component({ selector:'app-home', standalone:true, imports:[RouterLink], templateUrl:'./home.component.html', styleUrl:'./home.component.scss', changeDetection:ChangeDetectionStrategy.OnPush, encapsulation:ViewEncapsulation.None, schemas:[CUSTOM_ELEMENTS_SCHEMA] })
export class HomeComponent {
  private readonly api=inject(ContentApiService);
  private readonly router=inject(Router);
  private readonly route=inject(ActivatedRoute);
  private readonly injector=inject(Injector);
  private readonly destroyRef=inject(DestroyRef);
  protected readonly language=inject(LanguageService);
  protected readonly auth=inject(AuthService);
  protected readonly feedUi=inject(FeedUiService);
  protected readonly selectedCategory=signal<number|'all'>('all');
  protected readonly categoryOpen=signal(false);
  protected readonly categorySearch=signal('');
  protected readonly hoveredAuthorId=signal<number|null>(null);
  protected readonly hoverCardPosition=signal({top:0,left:0});
  private hoverTimer:ReturnType<typeof setTimeout>|null=null;
  protected readonly currentPage=signal(1);
  protected readonly pageSize=signal(5);
  protected readonly pageInput=signal(1);
  protected readonly sizeInput=signal(5);
  private readonly categoryRows=signal<ContentCategory[]>([]);
  private readonly postRows=signal<ContentPost[]>([]);
  private readonly likedIds=signal<Set<number>>(new Set());
  private readonly total=signal(0);
  private readonly totalPageCount=signal(1);

  constructor(){
    bindQueryState(this.route,this.router,this.injector,this.destroyRef,{
      q:{signal:this.feedUi.searchQuery,defaultValue:''},
      category:{signal:this.selectedCategory,defaultValue:'all',parse:value=>value==='all'?'all':positiveInteger(1)(value),serialize:value=>value==='all'?null:String(value)},
      page:{signal:this.currentPage,defaultValue:1,parse:positiveInteger(1)},
      limit:{signal:this.pageSize,defaultValue:5,parse:positiveInteger(5,100)},
    });
    this.pageInput.set(this.currentPage());this.sizeInput.set(this.pageSize());
    effect(()=>{
      const language=this.language.locale();
      this.api.categories({page:1,limit:100,language,sort:'name-asc'}).subscribe({
        next:response=>this.categoryRows.set(response.data.items),
        error:()=>this.categoryRows.set([]),
      });
    },{allowSignalWrites:true});
    effect(()=>{
      const language=this.language.locale();
      const page=this.currentPage();
      const limit=this.pageSize();
      const categoryId=this.selectedCategory();
      const search=this.feedUi.searchQuery().trim();
      this.api.posts({page,limit,language,categoryId:categoryId==='all'?undefined:categoryId,search,sort:'newest'}).subscribe({
        next:response=>{
          this.postRows.set(response.data.items);
          this.total.set(response.data.pagination.total);
          this.totalPageCount.set(Math.max(1,response.data.pagination.totalPages));
          this.loadLikedState(response.data.items);
        },
        error:()=>{this.postRows.set([]);this.total.set(0);this.totalPageCount.set(1);},
      });
    },{allowSignalWrites:true});
  }

  protected readonly categories=computed<FeedCategory[]>(()=>[
    {id:'all',name:this.language.choose('Tất cả','All')},
    ...this.categoryRows().map(row=>({id:row.id,name:this.categoryName(row)})).filter(item=>item.name),
  ]);
  protected readonly posts=computed<FeedPost[]>(()=>this.postRows().map(post=>this.mapPost(post)));
  protected readonly filteredPosts=computed(()=>this.posts());
  protected readonly totalPages=computed(()=>this.totalPageCount());
  protected readonly pageNumbers=computed(()=>buildPaginationItems(this.currentPage(),this.totalPages()));
  protected readonly visiblePosts=computed(()=>this.posts());
  protected readonly summary=computed(()=>{const total=this.total();const from=total?(this.currentPage()-1)*this.pageSize()+1:0;const to=Math.min(this.currentPage()*this.pageSize(),total);return this.language.translate('pagination.summary',{from,to,total});});
  protected readonly staffPicks=computed(()=>[...this.posts()].sort((a,b)=>(b.likes+b.comments)-(a.likes+a.comments)).slice(0,3));
  protected readonly hoveredAuthor=computed<AuthorHover|null>(()=>{const authorId=this.hoveredAuthorId();if(authorId===null)return null;const items=this.posts().filter(post=>post.authorId===authorId);const first=items[0];return first?{name:first.authorName,avatar:first.authorAvatar,posts:items.length,likes:items.reduce((sum,item)=>sum+item.likes,0)}:null;});
  protected readonly filteredCategories=computed(()=>{const search=this.categorySearch().trim().toLocaleLowerCase();return this.categories().filter(category=>category.name.toLocaleLowerCase().includes(search));});

  @HostListener('click',['$event']) protected openArticle(event:MouseEvent):void{const element=event.target as HTMLElement;const authorLink=element.closest('.author-name-wrapper a');if(authorLink){event.preventDefault();const id=this.hoveredAuthorId();if(id!==null)void this.router.navigate(['/profile',id]);return;}const target=element.closest('.article-title,.article-thumb');if(!target)return;event.preventDefault();const card=target.closest('.article-card');const root=card?.parentElement;if(!card||!root)return;const index=Array.from(root.children).indexOf(card);const post=this.visiblePosts()[index];if(post)void this.router.navigate(['/article',post.id]);}
  protected selectCategory(id:number|'all'):void{this.selectedCategory.set(id);this.currentPage.set(1);this.categoryOpen.set(false);}
  protected categoryLabel():string{return this.categories().find(c=>c.id===this.selectedCategory())?.name??this.categories()[0]?.name??'';}
  protected showAuthor(event:MouseEvent,authorId:number):void{if(this.hoverTimer)clearTimeout(this.hoverTimer);const rect=(event.currentTarget as HTMLElement).getBoundingClientRect();this.hoverCardPosition.set({top:rect.bottom,left:rect.left+rect.width/2});this.hoveredAuthorId.set(authorId);}
  protected scheduleAuthorHide():void{this.hoverTimer=setTimeout(()=>this.hoveredAuthorId.set(null),300);}
  protected keepAuthorOpen():void{if(this.hoverTimer)clearTimeout(this.hoverTimer);}
  protected changePage(page:number):void{const next=Math.min(Math.max(1,page),this.totalPages());this.currentPage.set(next);this.pageInput.set(next);document.querySelector('.feed-header')?.scrollIntoView({behavior:'smooth',block:'start'});}
  protected applyPage():void{this.changePage(this.pageInput());}
  protected applyPageSize():void{const size=Math.min(100,Math.max(1,Math.trunc(this.sizeInput()||1)));this.pageSize.set(size);this.sizeInput.set(size);this.changePage(1);}
  protected excerpt(html:string):string{const text=html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();return text.length>120?`${text.slice(0,120)}...`:text;}
  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale(),{month:'short',day:'numeric'}).format(new Date(value));}
  protected toggleLike(postId:number):void{if(!this.auth.isAuthenticated()){void this.router.navigate(['/login']);return;}this.api.toggleLike(String(postId)).subscribe({next:response=>{this.likedIds.update(ids=>{const next=new Set(ids);response.data.liked?next.add(postId):next.delete(postId);return next;});this.postRows.update(rows=>rows.map(row=>Number(row.id)===postId?{...row,likesCount:response.data.totalLikes}:row));}});}
  protected goToComments(postId:number):void{void this.router.navigate(['/article',postId],{fragment:'comments'});}

  private loadLikedState(posts:ContentPost[]):void{
    if(!this.auth.isAuthenticated()){this.likedIds.set(new Set());return;}
    const postIds=posts.map(post=>String(post.id));
    if(!postIds.length){this.likedIds.set(new Set());return;}
    this.api.myLikes(postIds).subscribe({next:response=>this.likedIds.set(new Set(response.data.likedPostIds.map(Number))),error:()=>this.likedIds.set(new Set())});
  }
  private mapPost(post:ContentPost):FeedPost{
    const translation=post.translations[0];
    const categoryName=this.categoryName(post.category);
    const name=post.author?.fullName||post.author?.userName||'Unknown';
    return {id:Number(post.id),authorId:post.authorId,categoryId:post.categoryId,title:translation?.title??'',content:translation?.content??'',authorName:name,authorAvatar:post.author?.avatar||`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,categoryName,thumbnail:post.thumbnail,createdAt:post.publishedAt||post.createdAt,likes:Number(post.likesCount??0),comments:Number(post.commentsCount??0),isLiked:this.likedIds().has(Number(post.id))};
  }
  private categoryName(category:ContentCategory):string{
    const languageId=this.language.languageId();
    return category.translations.find(item=>item.languageId===languageId)?.name??category.translations[0]?.name??'';
  }
}
