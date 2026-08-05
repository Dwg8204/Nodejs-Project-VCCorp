import { AfterViewInit, ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, DestroyRef, effect, ElementRef, inject, Injector, NgZone, OnDestroy, signal, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { APP_CONFIG } from '../../core/config/app.config';
import { DashboardApiService, DashboardData } from '../../core/services/dashboard-api.service';
import { LanguageService } from '../../core/services/language.service';
import { NotificationService } from '../../core/services/notification.service';
import { bindQueryState, positiveInteger } from '../../shared/utils/query-state';

Chart.register(...registerables);

@Component({selector:'app-admin-dashboard',standalone:true,templateUrl:'./admin-dashboard.component.html',styleUrl:'./admin-dashboard.component.scss',changeDetection:ChangeDetectionStrategy.OnPush,encapsulation:ViewEncapsulation.None,schemas:[CUSTOM_ELEMENTS_SCHEMA],imports:[RouterLink]})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
  private readonly api=inject(DashboardApiService);private readonly notifications=inject(NotificationService);private readonly route=inject(ActivatedRoute);private readonly router=inject(Router);private readonly injector=inject(Injector);private readonly destroyRef=inject(DestroyRef);private readonly zone=inject(NgZone);
  protected readonly language=inject(LanguageService);protected readonly period=signal(30);protected readonly periodOpen=signal(false);
  private readonly data=signal<DashboardData|null>(null);private events?:EventSource;
  @ViewChild('engagementCanvas') private canvas?:ElementRef<HTMLCanvasElement>;
  private chart?:Chart<'line'>;
  protected readonly statistics=computed(()=>{const value=this.data()?.stats;return[
    {icon:'solar:users-group-rounded-bold-duotone',tone:'kpi-purple',value:value?.users??0,vi:'Người dùng',en:'Users',link:['/admin/users']},
    {icon:'solar:document-text-bold-duotone',tone:'kpi-blue',value:value?.posts??0,vi:'Bài viết',en:'Posts',link:['/admin/posts']},
    {icon:'solar:clock-circle-bold-duotone',tone:'kpi-orange',value:this.data()?.postStatus?.PENDING??0,vi:'Bài chờ duyệt',en:'Pending Posts',link:['/admin/posts'],queryParams:{status:'PENDING'}},
    {icon:'solar:folder-with-files-bold-duotone',tone:'kpi-green',value:value?.categories??0,vi:'Danh mục',en:'Categories',link:['/admin/categories']},
    {icon:'solar:global-bold-duotone',tone:'kpi-cyan',value:value?.languages??0,vi:'Ngôn ngữ',en:'Languages',link:['/admin/languages']},
    {icon:'solar:heart-bold-duotone',tone:'kpi-pink',value:value?.likes??0,vi:'Lượt thích',en:'Likes'},
    {icon:'solar:chat-round-dots-bold-duotone',tone:'kpi-purple',value:value?.comments??0,vi:'Bình luận',en:'Comments'},
    {icon:'solar:chart-2-bold-duotone',tone:'kpi-green',value:value?.engagementPerPost??0,vi:'Tương tác / bài',en:'Engagement / post'},
  ];});
  protected readonly postStatuses=computed(()=>{const status=this.data()?.postStatus;return[{vi:'Đã xuất bản',en:'Published',value:status?.PUBLISHED??0},{vi:'Bản nháp',en:'Draft',value:status?.DRAFT??0},{vi:'Chờ duyệt',en:'Pending',value:status?.PENDING??0},{vi:'Từ chối',en:'Rejected',value:status?.REJECTED??0}];});
  protected readonly postTotal=computed(()=>this.postStatuses().reduce((sum,row)=>sum+row.value,0));
  protected readonly statusStops=computed(()=>{const total=Math.max(this.postTotal(),1),rows=this.postStatuses(),published=rows[0].value/total*100,draft=rows[1].value/total*100,pending=rows[2].value/total*100;return{published,draft:published+draft,pending:published+draft+pending};});
  protected readonly topPosts=computed(()=>(this.data()?.topPosts??[]).map(post=>{const translations=post.translations??[];const title=translations.find(item=>item.languageId===this.language.languageId())?.title??translations[0]?.title??`#${post.id}`;const likes=Number(post.likesCount??0),comments=Number(post.commentsCount??0);return{id:Number(post.id),title,likes,comments,value:likes+comments};}));
  protected readonly maxTopPost=computed(()=>Math.max(1,...this.topPosts().map(row=>row.value)));
  protected readonly translationCoverage=computed(()=>{const total=Math.max(this.data()?.stats?.posts??0,1);return(this.data()?.translationCoverage??[]).map(row=>{const lang=this.language.availableLanguages().find(item=>item.id===row.languageId);return{vi:lang?.name??`#${row.languageId}`,en:lang?.name??`#${row.languageId}`,value:row.total,tone:row.autoTranslated?'coverage-auto':'coverage-both',percent:row.total/total*100};});});
  protected readonly categoryStats=computed(()=>{const rows=(this.data()?.contentByCategory??[]).filter(row=>row.languageId===this.language.languageId()).sort((a,b)=>b.postsCount-a.postsCount),max=Math.max(1,...rows.map(row=>row.postsCount));return rows.map(row=>({name:row.name,value:row.postsCount,percent:row.postsCount/max*100}));});
  protected readonly recentActivity=computed(()=>(this.data()?.recentActivity??[]).map(log=>({text:`${this.activityAction(log.action)}: ${log.entityLabel||'#'+(log.entityId||'')}`,date:log.createdAt,icon:log.entityType==='POST'?'solar:document-text-bold-duotone':log.entityType==='CATEGORY'?'solar:folder-bold-duotone':'solar:shield-check-bold-duotone',tone:log.entityType==='CATEGORY'?'purple':'blue'})));
  protected readonly engagementChartData=computed(()=>this.data()?.engagementTrend??[]);
  constructor(){bindQueryState(this.route,this.router,this.injector,this.destroyRef,{period:{signal:this.period,defaultValue:30,parse:positiveInteger(30,365)}});effect(()=>this.load(this.period()),{allowSignalWrites:true});effect(()=>{this.language.locale();this.engagementChartData();queueMicrotask(()=>this.renderChart());});this.startRealtime();}
  ngAfterViewInit():void{this.renderChart();}
  ngOnDestroy():void{this.events?.close();this.chart?.destroy();}
  protected label(item:{vi:string;en:string}):string{return this.language.choose(item.vi,item.en);}
  protected selectPeriod(value:number):void{this.period.set(value);this.periodOpen.set(false);}
  protected formatActivityDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale(),{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));}
  private load(period:number):void{this.api.get(period).subscribe({next:({data})=>{this.data.set(data);queueMicrotask(()=>this.renderChart());},error:error=>this.notifications.fromApi(error)});}
  private renderChart():void{const canvas=this.canvas?.nativeElement;if(!canvas||!canvas.isConnected)return;const rows=this.engagementChartData();const config:ChartConfiguration<'line'>={type:'line',data:{labels:rows.map(row=>row.date.slice(5)),datasets:[{label:this.language.choose('Lượt thích','Likes'),data:rows.map(row=>Number(row.likes)||0),borderColor:'#168b20',backgroundColor:'rgba(22,139,32,.12)',pointBackgroundColor:'#168b20',pointRadius:3,pointHoverRadius:6,tension:.32,fill:false},{label:this.language.choose('Bình luận','Comments'),data:rows.map(row=>Number(row.comments)||0),borderColor:'#7357d8',backgroundColor:'rgba(115,87,216,.12)',pointBackgroundColor:'#7357d8',pointRadius:3,pointHoverRadius:6,tension:.32,fill:false}]},options:{responsive:true,maintainAspectRatio:false,devicePixelRatio:Math.min(window.devicePixelRatio||1,2),resizeDelay:100,animation:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{enabled:true}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:6}},y:{beginAtZero:true,ticks:{precision:0},grid:{color:'rgba(127,127,127,.15)'}}}}};this.zone.runOutsideAngular(()=>{if(this.chart){this.chart.data=config.data;this.chart.options=config.options??{};this.chart.update('none');}else this.chart=new Chart(canvas,config);});}
  private startRealtime():void{this.zone.runOutsideAngular(()=>{try{this.events=new EventSource(`${APP_CONFIG.apiBaseUrl}/admin/dashboard/events`,{withCredentials:true});this.events.onmessage=(message)=>{this.zone.run(()=>{try{const event=JSON.parse(message.data) as {type?:string};if(event.type==='LIKE_CHANGED'||event.type==='COMMENT_CREATED')this.load(this.period());}catch{this.load(this.period());}});};}catch{this.events=undefined;}});}
  private activityAction(action:string):string{const labels:Record<string,{vi:string;en:string}>={AUTH_LOGIN_SUCCEEDED:{vi:'Đăng nhập thành công',en:'Login succeeded'},AUTH_LOGOUT:{vi:'Đăng xuất',en:'Logged out'},LANGUAGE_CREATED:{vi:'Đã tạo ngôn ngữ',en:'Language created'},LANGUAGE_DEFAULT_CHANGED:{vi:'Đã đổi ngôn ngữ mặc định',en:'Default language changed'},POST_APPROVED:{vi:'Đã duyệt bài viết',en:'Post approved'},POST_REJECTED:{vi:'Đã từ chối bài viết',en:'Post rejected'},CATEGORY_CREATED:{vi:'Đã tạo danh mục',en:'Category created'},CATEGORY_UPDATED:{vi:'Đã cập nhật danh mục',en:'Category updated'},CATEGORY_DELETED:{vi:'Đã xóa danh mục',en:'Category deleted'}};const label=labels[action];return label?this.language.choose(label.vi,label.en):action.replaceAll('_',' ');}
}
