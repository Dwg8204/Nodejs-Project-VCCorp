import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, effect, HostListener, inject, signal, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ContentComment, ContentPost } from '../../core/models/content.model';
import { AuthService } from '../../core/services/auth.service';
import { ContentApiService } from '../../core/services/content-api.service';
import { LanguageService } from '../../core/services/language.service';

interface ArticleView { id:number; authorId:number; categoryId:number; title:string; content:string; thumbnail:string; category:string; author:string; avatar:string|null; date:string; likes:number; comments:number; }
interface CommentView { id:number; userId:number; rootId:number; name:string; initial:string; avatar:string|null; mention:string|null; content:string; date:string; depth:0|1; }
interface CommentGroup { root:CommentView;replies:CommentView[]; }
interface RelatedView { id:number;title:string;thumbnail:string;category:string;author:string;date:string; }

@Component({selector:'app-article',standalone:true,imports:[RouterLink],templateUrl:'./article.component.html',styleUrl:'./article.component.scss',changeDetection:ChangeDetectionStrategy.OnPush,encapsulation:ViewEncapsulation.None,schemas:[CUSTOM_ELEMENTS_SCHEMA]})
export class ArticleComponent {
  private readonly route=inject(ActivatedRoute);
  private readonly router=inject(Router);
  private readonly api=inject(ContentApiService);
  protected readonly auth=inject(AuthService);
  protected readonly language=inject(LanguageService);
  protected readonly commentText=signal('');
  protected readonly replyTo=signal<number|null>(null);
  protected readonly replyText=signal('');
  protected readonly expandedReplies=signal<Set<number>>(new Set());
  protected readonly commentPendingDelete=signal<CommentView|null>(null);
  protected readonly deletingComment=signal(false);
  protected readonly id=signal(Number(this.route.snapshot.paramMap.get('id')));
  private readonly preview=this.route.snapshot.queryParamMap.get('preview')==='1';
  private readonly post=signal<ContentPost|null>(null);
  private readonly commentRows=signal<ContentComment[]>([]);
  private readonly relatedRows=signal<ContentPost[]>([]);
  protected readonly liked=signal(false);

  constructor(){
    this.route.paramMap.subscribe(params=>this.id.set(Number(params.get('id'))));
    effect(()=>{
      const id=this.id();
      const language=this.language.locale();
      const request=this.preview
        ?(this.auth.role()==='SUPER_ADMIN'?this.api.adminPost(String(id)):this.api.ownerPost(String(id)))
        :this.api.post(String(id));
      request.subscribe({
        next:response=>{this.post.set(response.data.item);if(!this.preview)this.loadRelated(response.data.item.categoryId,language);},
        error:()=>this.post.set(null),
      });
      if(!this.preview)this.loadComments();
      if(!this.preview&&this.auth.isAuthenticated())this.api.myLike(String(id)).subscribe({next:response=>this.liked.set(response.data.liked)});
    },{allowSignalWrites:true});
  }

  protected readonly article=computed<ArticleView|null>(()=>{
    const post=this.post();if(!post)return null;
    const translation=this.translation(post);
    const categoryTranslation=post.category?.translations.find(item=>item.languageId===this.language.languageId())??post.category?.translations[0];
    const author=post.author?.fullName||post.author?.userName||'Anonymous';
    return{id:Number(post.id),authorId:post.authorId,categoryId:post.categoryId,title:translation?.title??'',content:translation?.content??'',thumbnail:post.thumbnail,category:categoryTranslation?.name??'',author,avatar:post.author?.avatar??null,date:post.publishedAt??post.createdAt,likes:Number(post.likesCount??0),comments:Number(post.commentsCount??this.commentRows().length)};
  });
  protected readonly related=computed<RelatedView[]>(()=>this.relatedRows().filter(row=>Number(row.id)!==this.id()).slice(0,3).map(row=>{const translation=this.translation(row);const category=row.category.translations.find(item=>item.languageId===this.language.languageId())??row.category.translations[0];return{id:Number(row.id),title:translation?.title??'',thumbnail:row.thumbnail,category:category?.name??'',author:row.author?.fullName||row.author?.userName||'',date:row.publishedAt??row.createdAt};}));
  protected readonly comments=computed<CommentView[]>(()=>{
    const rows=this.commentRows();
    const roots=rows.filter(row=>row.parentId===null);
    const rootId=(row:ContentComment):string=>{
      let current=row;
      const visited=new Set<string>();
      while(current.parentId&&!visited.has(current.id)){
        visited.add(current.id);
        const parent=rows.find(item=>item.id===current.parentId);
        if(!parent)break;
        current=parent;
      }
      return current.id;
    };
    const view=(row:ContentComment,depth:0|1,rootIdValue:number):CommentView=>{
      const name=row.user?.userName||'Anonymous';
      const repliedUser=depth===1?rows.find(item=>item.id===row.parentId):null;
      const knownUsers=rows
        .map(item=>({userId:item.userId,name:item.user?.userName?.trim()||''}))
        .filter(item=>item.name)
        .sort((left,right)=>right.name.length-left.name.length);
      const storedMention=knownUsers.find(item=>row.content.startsWith(`@${item.name}`));
      const mention=storedMention
        ?(storedMention.userId!==row.userId?storedMention.name:null)
        :(repliedUser&&repliedUser.userId!==row.userId?repliedUser.user?.userName?.trim()||null:null);
      const content=storedMention
        ?row.content.slice(storedMention.name.length+1).trimStart()
        :row.content;
      const avatar=row.user?.avatar
        ??(row.userId===this.auth.currentUser()?.id?this.auth.currentUser()?.avatar:null)
        ??(row.userId===this.article()?.authorId?this.article()?.avatar:null)
        ??null;
      return{id:Number(row.id),userId:row.userId,rootId:rootIdValue,name,initial:name.charAt(0).toUpperCase(),avatar,mention,content,date:row.createdAt,depth};
    };
    const output:CommentView[]=[];
    for(const root of roots){
      output.push(view(root,0,Number(root.id)));
      rows.filter(row=>row.parentId!==null&&rootId(row)===root.id).forEach(row=>output.push(view(row,1,Number(root.id))));
    }
    return output;
  });
  protected readonly commentGroups=computed<CommentGroup[]>(()=>this.comments().filter(comment=>comment.depth===0).map(root=>({root,replies:this.comments().filter(comment=>comment.depth===1&&comment.rootId===root.id)})));

  protected formatDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale(),{month:'short',day:'numeric',year:'numeric'}).format(new Date(value));}
  protected toggleLike():void{if(!this.auth.isAuthenticated()){void this.router.navigate(['/login']);return;}this.api.toggleLike(String(this.id())).subscribe({next:response=>{this.liked.set(response.data.liked);this.post.update(post=>post?{...post,likesCount:response.data.totalLikes}:post);}});}
  protected submitComment(parentId:number|null):void{if(!this.auth.isAuthenticated())return;const value=(parentId===null?this.commentText():this.replyText()).trim();if(!value)return;this.api.createComment(String(this.id()),value,parentId===null?null:String(parentId)).subscribe({next:()=>{this.commentText.set('');this.replyText.set('');this.replyTo.set(null);this.resetCommentTextareas();this.loadComments();this.post.update(post=>post?{...post,commentsCount:Number(post.commentsCount??0)+1}:post);}});}
  protected keySubmit(event:KeyboardEvent,parentId:number|null):void{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();this.submitComment(parentId);}}
  protected replyPlaceholder(commentId:number):string{const comment=this.comments().find(item=>item.id===commentId);const prompt=this.language.choose('Viết phản hồi...','Write a reply...');return comment&&comment.userId!==this.auth.currentUser()?.id?`@${comment.name} ${prompt}`:prompt;}
  protected visibleReplies(group:CommentGroup):CommentView[]{return this.expandedReplies().has(group.root.id)?group.replies:group.replies.slice(-2);}
  protected hiddenReplyCount(group:CommentGroup):number{return Math.max(0,group.replies.length-2);}
  protected toggleReplies(rootId:number):void{this.expandedReplies.update(current=>{const next=new Set(current);next.has(rootId)?next.delete(rootId):next.add(rootId);return next;});}
  protected requestDeleteComment(comment:CommentView):void{if(comment.userId===this.auth.currentUser()?.id)this.commentPendingDelete.set(comment);}
  protected cancelDeleteComment():void{if(!this.deletingComment())this.commentPendingDelete.set(null);}
  protected confirmDeleteComment():void{
    const comment=this.commentPendingDelete();
    if(!comment||this.deletingComment())return;
    this.deletingComment.set(true);
    this.api.deleteComment(String(this.id()),String(comment.id)).subscribe({
      next:response=>{
        this.commentPendingDelete.set(null);
        this.deletingComment.set(false);
        this.loadComments();
        this.post.update(post=>post?{...post,commentsCount:Math.max(0,Number(post.commentsCount??0)-response.data.deletedCount)}:post);
      },
      error:()=>this.deletingComment.set(false),
    });
  }
  protected focusComment():void{document.querySelector<HTMLElement>('.responses-section')?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>document.querySelector<HTMLTextAreaElement>('.comment-input .comment-textarea')?.focus());}
  @HostListener('input',['$event']) protected resizeCommentTextarea(event:Event):void{
    const textarea=event.target;
    if(!(textarea instanceof HTMLTextAreaElement)||!textarea.classList.contains('comment-textarea'))return;
    textarea.style.height='auto';
    textarea.style.height=`${textarea.scrollHeight}px`;
  }
  @HostListener('click',['$event']) protected openAuthor(event:MouseEvent):void{const target=(event.target as HTMLElement).closest('.byline .author-name,.byline .author-avatar');if(!target)return;event.preventDefault();const id=this.article()?.authorId;if(id)void this.router.navigate(['/profile',id]);}

  private loadComments():void{this.api.comments(String(this.id()),{page:1,limit:100}).subscribe({next:response=>this.commentRows.set(response.data.items),error:()=>this.commentRows.set([])});}
  private resetCommentTextareas():void{requestAnimationFrame(()=>document.querySelectorAll<HTMLTextAreaElement>('.responses-section textarea.comment-textarea').forEach(textarea=>{textarea.value='';textarea.style.removeProperty('height');}));}
  private loadRelated(categoryId:number,language:string):void{this.api.posts({page:1,limit:4,categoryId,language,sort:'newest'}).subscribe({next:response=>this.relatedRows.set(response.data.items),error:()=>this.relatedRows.set([])});}
  private translation(post:ContentPost){return post.translations.find(item=>item.languageId===this.language.languageId())??post.translations[0];}
}
