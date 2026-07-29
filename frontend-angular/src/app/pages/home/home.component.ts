import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, HostListener, inject, signal, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { FeedUiService } from '../../core/services/feed-ui.service';
import { LanguageService } from '../../core/services/language.service';
import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { buildPaginationItems } from '../../shared/utils/pagination';

interface FeedPost { id:number; authorId:number; categoryId:number; title:string; content:string; authorName:string; authorAvatar:string; categoryName:string; thumbnail:string; createdAt:string; likes:number; comments:number; isLiked:boolean; }
interface FeedCategory { id:number|'all'; name:string; }
interface AuthorHover { name:string; avatar:string; posts:number; likes:number; }

@Component({ selector:'app-home', standalone:true, imports:[RouterLink], templateUrl:'./home.component.html', styleUrl:'./home.component.scss', changeDetection:ChangeDetectionStrategy.OnPush, encapsulation:ViewEncapsulation.None, schemas:[CUSTOM_ELEMENTS_SCHEMA] })
export class HomeComponent {
  private readonly database=inject(MockDatabaseService);
  private readonly router=inject(Router);
  protected readonly language=inject(LanguageService);
  protected readonly auth=inject(AuthService);
  protected readonly feedUi=inject(FeedUiService);
  protected readonly selectedCategory=signal<number|'all'>('all');
  protected readonly categoryOpen=signal(false);
  protected readonly categorySearch=signal('');
  protected readonly hoveredAuthorId=signal<number|null>(null);
  protected readonly hoverCardPosition=signal({top:0,left:0});
  private hoverTimer:ReturnType<typeof setTimeout>|null=null;
  private readonly revision = signal(0);
  protected readonly currentPage=signal(1);
  protected readonly pageSize=signal(5);
  protected readonly pageInput=signal(1);
  protected readonly sizeInput=signal(5);
  protected readonly categories=computed<FeedCategory[]>(()=>{
    const languageId=this.language.contentLanguageId();
    const rows=this.database.table('categories').filter(row=>!row.deleted_at);
    const translations=this.database.table('category_translation');
    return [{id:'all',name:this.language.choose('Tất cả','All')},...rows.map(row=>({id:row.id,name:translations.find(t=>t.category_id===row.id&&t.language_id===languageId)?.name??''})).filter(item=>item.name)];
  });
  protected readonly posts=computed<FeedPost[]>(()=>{
    this.revision();
    const languageId=this.language.contentLanguageId();
    const currentUser = this.auth.currentUser();
    const users=this.database.table('users'); const roles=this.database.table('role'); void roles;
    const categories=this.database.table('category_translation'); const translations=this.database.table('post_translations');
    const likes=this.database.table('post_likes'); const comments=this.database.table('comments');
    return this.database.table('posts').filter(p=>p.status==='PUBLISHED'&&!p.deleted_at).map(post=>{
      const translation=translations.find(t=>t.post_id===post.id&&t.language_id===languageId); if(!translation)return null;
      const author=users.find(u=>u.id===post.author_id); const category=categories.find(t=>t.category_id===post.category_id&&t.language_id===languageId);
      return {id:post.id,authorId:post.author_id,categoryId:post.category_id,title:translation.title,content:translation.content,authorName:author?.full_name||author?.user_name||'Unknown',authorAvatar:author?.avatar||`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(author?.full_name||'U')}`,categoryName:category?.name||'',thumbnail:post.thumbnail,createdAt:post.published_at||post.created_at,likes:likes.filter(l=>l.post_id===post.id&&l.is_liked).length,comments:comments.filter(c=>c.post_id===post.id&&!c.deleted_at).length,isLiked:currentUser ? likes.some(l=>l.post_id===post.id&&l.user_id===currentUser.id&&l.is_liked) : false} as FeedPost;
    }).filter((post):post is FeedPost=>post!==null).sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime());
  });
  protected readonly filteredPosts=computed(()=>{const search=this.feedUi.searchQuery().trim().toLocaleLowerCase();return this.posts().filter(post=>(this.selectedCategory()==='all'||post.categoryId===this.selectedCategory())&&(!search||[post.title,post.authorName,post.categoryName].some(value=>value.toLocaleLowerCase().includes(search))));});
  protected readonly totalPages=computed(()=>Math.max(1,Math.ceil(this.filteredPosts().length/this.pageSize())));
  protected readonly pageNumbers=computed(()=>buildPaginationItems(this.currentPage(),this.totalPages()));
  protected readonly visiblePosts=computed(()=>{const page=Math.min(this.currentPage(),this.totalPages());return this.filteredPosts().slice((page-1)*this.pageSize(),page*this.pageSize());});
  protected readonly summary=computed(()=>{const total=this.filteredPosts().length;const from=total?(this.currentPage()-1)*this.pageSize()+1:0;const to=Math.min(this.currentPage()*this.pageSize(),total);return this.language.translate('pagination.summary',{from,to,total});});
  @HostListener('click',['$event']) protected openArticle(event:MouseEvent):void{const element=event.target as HTMLElement;const authorLink=element.closest('.author-name-wrapper a');if(authorLink){event.preventDefault();const id=this.hoveredAuthorId();if(id!==null)void this.router.navigate(['/profile',id]);return;}const target=element.closest('.article-title,.article-thumb');if(!target)return;event.preventDefault();const card=target.closest('.article-card');const root=card?.parentElement;if(!card||!root)return;const index=Array.from(root.children).indexOf(card);const post=this.visiblePosts()[index];if(post)void this.router.navigate(['/article',post.id]);}
  protected readonly staffPicks=computed(()=>[...this.posts()].sort((a,b)=>(b.likes+b.comments)-(a.likes+a.comments)).slice(0,3));
  protected readonly hoveredAuthor=computed<AuthorHover|null>(()=>{
    const authorId=this.hoveredAuthorId(); if(authorId===null)return null;
    const user=this.database.table('users').find(row=>row.id===authorId); if(!user)return null;
    const posts=this.database.table('posts').filter(row=>row.author_id===authorId&&row.status==='PUBLISHED'&&!row.deleted_at);
    const likes=this.database.table('post_likes').filter(row=>row.is_liked&&posts.some(post=>post.id===row.post_id)).length;
    return {name:user.full_name||user.user_name,avatar:user.avatar||`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.full_name||user.user_name)}`,posts:posts.length,likes};
  });
  protected readonly filteredCategories=computed(()=>{const search=this.categorySearch().trim().toLocaleLowerCase();return this.categories().filter(category=>category.name.toLocaleLowerCase().includes(search));});
  protected selectCategory(id:number|'all'):void{this.selectedCategory.set(id);this.currentPage.set(1);this.categoryOpen.set(false);}
  protected categoryLabel():string{return this.categories().find(c=>c.id===this.selectedCategory())?.name??this.categories()[0].name;}
  protected showAuthor(event:MouseEvent,authorId:number):void{if(this.hoverTimer)clearTimeout(this.hoverTimer);const rect=(event.currentTarget as HTMLElement).getBoundingClientRect();this.hoverCardPosition.set({top:rect.bottom,left:rect.left+rect.width/2});this.hoveredAuthorId.set(authorId);}
  protected scheduleAuthorHide():void{this.hoverTimer=setTimeout(()=>this.hoveredAuthorId.set(null),300);}
  protected keepAuthorOpen():void{if(this.hoverTimer)clearTimeout(this.hoverTimer);}
  protected changePage(page:number):void{const next=Math.min(Math.max(1,page),this.totalPages());this.currentPage.set(next);this.pageInput.set(next);document.querySelector('.feed-header')?.scrollIntoView({behavior:'smooth',block:'start'});}
  protected applyPage():void{this.changePage(this.pageInput());}
  protected applyPageSize():void{const size=Math.min(100,Math.max(1,Math.trunc(this.sizeInput()||1)));this.pageSize.set(size);this.sizeInput.set(size);this.changePage(1);}
  protected excerpt(html:string):string{const text=html.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();return text.length>120?`${text.slice(0,120)}...`:text;}
  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale(),{month:'short',day:'numeric'}).format(new Date(value));}
  
  protected toggleLike(postId: number): void {
    const user = this.auth.currentUser();
    if (!user) {
      void this.router.navigate(['/login']);
      return;
    }
    const likes = this.database.table('post_likes');
    const existing = likes.find(l => l.post_id === postId && l.user_id === user.id);
    if (existing) {
      existing.is_liked = !existing.is_liked;
      existing.updated_at = new Date().toISOString();
    } else {
      likes.push({
        id: this.database.nextId('post_likes'),
        post_id: postId,
        user_id: user.id,
        is_liked: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    this.database.write('post_likes', likes);
    this.revision.update(x => x + 1);
  }

  protected goToComments(postId: number): void {
    void this.router.navigate(['/article', postId], { fragment: 'comments' });
  }
}
