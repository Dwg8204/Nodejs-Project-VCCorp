import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';
import { MockDatabaseService } from '../../data/mock/mock-database.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [RouterLink],
})
export class AdminDashboardComponent {
  private readonly database = inject(MockDatabaseService);
  protected readonly language = inject(LanguageService);
  protected readonly period = signal(30);
  protected readonly periodOpen = signal(false);

  protected readonly statistics = computed(() => {
    const posts = this.database.table('posts').filter((row) => !row.deleted_at);
    const likes = this.database.table('post_likes').filter((row) => row.is_liked).length;
    const comments = this.database.table('comments').filter((row) => !row.deleted_at).length;
    return [
      { icon: 'solar:users-group-rounded-bold-duotone', tone: 'kpi-purple', value: this.database.table('users').length, vi: 'Người dùng', en: 'Users', link: ['/admin/users'] },
      { icon: 'solar:document-text-bold-duotone', tone: 'kpi-blue', value: posts.length, vi: 'Bài viết', en: 'Posts', link: ['/admin/posts'] },
      { icon: 'solar:clock-circle-bold-duotone', tone: 'kpi-orange', value: posts.filter((row) => row.status === 'PENDING').length, vi: 'Bài chờ duyệt', en: 'Pending Posts', link: ['/admin/posts'], queryParams: { status: 'PENDING' } },
      { icon: 'solar:folder-with-files-bold-duotone', tone: 'kpi-green', value: this.database.table('categories').filter((row) => !row.deleted_at).length, vi: 'Danh mục', en: 'Categories', link: ['/admin/categories'] },
      { icon: 'solar:global-bold-duotone', tone: 'kpi-cyan', value: this.database.table('languages').filter((row) => !row.deleted_at).length, vi: 'Ngôn ngữ', en: 'Languages', link: ['/admin/languages'] },
      { icon: 'solar:heart-bold-duotone', tone: 'kpi-pink', value: likes, vi: 'Lượt thích', en: 'Likes' },
      { icon: 'solar:chat-round-dots-bold-duotone', tone: 'kpi-purple', value: comments, vi: 'Bình luận', en: 'Comments' },
      { icon: 'solar:chart-2-bold-duotone', tone: 'kpi-green', value: posts.length ? ((likes + comments) / posts.length).toFixed(1) : '0', vi: 'Tương tác / bài', en: 'Engagement / post' },
    ];
  });

  protected readonly postStatuses = computed(() => {
    const posts = this.database.table('posts').filter((row) => !row.deleted_at);
    return [
      { vi: 'Đã xuất bản', en: 'Published', value: posts.filter((row) => row.status === 'PUBLISHED').length },
      { vi: 'Bản nháp', en: 'Draft', value: posts.filter((row) => row.status === 'DRAFT').length },
      { vi: 'Chờ duyệt', en: 'Pending', value: posts.filter((row) => row.status === 'PENDING').length },
      { vi: 'Từ chối', en: 'Rejected', value: posts.filter((row) => row.status === 'REJECTED').length },
    ];
  });

  protected readonly postTotal = computed(() => this.postStatuses().reduce((sum, row) => sum + row.value, 0));
  protected readonly statusStops = computed(() => {
    const total = Math.max(this.postTotal(), 1); const rows = this.postStatuses();
    const published = rows[0].value / total * 100; const draft = rows[1].value / total * 100; const pending = rows[2].value / total * 100;
    return { published, draft: published + draft, pending: published + draft + pending };
  });

  protected readonly topPosts = computed(() => {
    const localeId = this.language.contentLanguageId();
    const likes = this.database.table('post_likes');
    const comments = this.database.table('comments');
    const translations = this.database.table('post_translations');
    return this.database.table('posts').map((post) => ({ id: post.id,
      title: translations.find((row) => row.post_id === post.id && row.language_id === localeId)?.title ?? `#${post.id}`,
      likes: likes.filter((row) => row.post_id === post.id && row.is_liked).length,
      comments: comments.filter((row) => row.post_id === post.id && !row.deleted_at).length,
      value: likes.filter((row) => row.post_id === post.id && row.is_liked).length + comments.filter((row) => row.post_id === post.id && !row.deleted_at).length,
    })).sort((a, b) => b.value - a.value).slice(0, 4);
  });

  protected readonly maxTopPost = computed(() => Math.max(1, ...this.topPosts().map((row) => row.value)));
  protected readonly translationCoverage = computed(() => {
    const posts=this.database.table('posts').filter(row=>!row.deleted_at); const translations=this.database.table('post_translations'); const total=Math.max(posts.length,1);
    const languageIds=this.database.table('languages').filter(row=>row.is_active&&row.is_system_language&&!row.deleted_at).map(row=>row.id);
    const currentId=this.language.contentLanguageId();
    const all=posts.filter(post=>languageIds.every(id=>translations.some(t=>t.post_id===post.id&&t.language_id===id))).length;
    const currentOnly=posts.filter(post=>translations.some(t=>t.post_id===post.id&&t.language_id===currentId)&&translations.filter(t=>t.post_id===post.id).length===1).length;
    const missingCurrent=posts.filter(post=>!translations.some(t=>t.post_id===post.id&&t.language_id===currentId)).length;
    const auto=new Set(translations.filter(t=>t.is_auto_translated).map(t=>t.post_id)).size;
    return [{vi:'Có đủ mọi ngôn ngữ',en:'Available in all languages',value:all,tone:'coverage-both'},{vi:'Chỉ có ngôn ngữ hiện tại',en:'Current language only',value:currentOnly,tone:'coverage-vi'},{vi:'Thiếu ngôn ngữ hiện tại',en:'Missing current language',value:missingCurrent,tone:'coverage-en'},{vi:'Có bản dịch tự động',en:'Auto-translated',value:auto,tone:'coverage-auto'}].map(row=>({...row,percent:row.value/total*100}));
  });
  protected readonly categoryStats = computed(() => {
    const languageId=this.language.contentLanguageId(); const posts=this.database.table('posts'); const translations=this.database.table('category_translation');
    const rows=this.database.table('categories').filter(c=>!c.deleted_at).map(category=>({name:translations.find(t=>t.category_id===category.id&&t.language_id===languageId)?.name??`#${category.id}`,value:posts.filter(p=>p.category_id===category.id&&p.status==='PUBLISHED'&&!p.deleted_at).length})).sort((a,b)=>b.value-a.value);
    const max=Math.max(1,...rows.map(row=>row.value)); return rows.map(row=>({...row,percent:row.value/max*100}));
  });
  protected readonly recentActivity = computed(() => {
    const logs=this.database.table('audit_logs');
    if(logs.length)return [...logs].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,6).map(log=>({text:`${this.activityAction(log.action)}: ${log.entity_label||'#'+(log.entity_id||'')}`,date:log.created_at,icon:log.entity_type==='POST'?'solar:document-text-bold-duotone':log.entity_type==='CATEGORY'?'solar:folder-bold-duotone':'solar:shield-check-bold-duotone',tone:log.entity_type==='CATEGORY'?'purple':'blue'}));
    const translations=this.database.table('post_translations'); return this.database.table('posts').slice(0,4).map(post=>({text:`${this.language.choose('Bài viết mới','New post')}: ${translations.find(t=>t.post_id===post.id&&t.language_id===(this.language.contentLanguageId()))?.title||'#'+post.id}`,date:post.created_at,icon:'solar:document-add-bold-duotone',tone:'blue'}));
  });

  protected formatActivityDate(value:string):string{return new Intl.DateTimeFormat(this.language.formatLocale(),{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));}
  private activityAction(action:string):string {
    const labels:Record<string,{vi:string;en:string}>={
      AUTH_LOGIN_SUCCEEDED:{vi:'Đăng nhập thành công',en:'Login succeeded'},AUTH_LOGOUT:{vi:'Đăng xuất',en:'Logged out'},
      LANGUAGE_CREATED:{vi:'Đã tạo ngôn ngữ',en:'Language created'},LANGUAGE_DEFAULT_CHANGED:{vi:'Đã đổi ngôn ngữ mặc định',en:'Default language changed'},
      POST_APPROVED:{vi:'Đã duyệt bài viết',en:'Post approved'},POST_REJECTED:{vi:'Đã từ chối bài viết',en:'Post rejected'},
      CATEGORY_CREATED:{vi:'Đã tạo danh mục',en:'Category created'},CATEGORY_UPDATED:{vi:'Đã cập nhật danh mục',en:'Category updated'},
      CATEGORY_DELETED:{vi:'Đã xóa danh mục',en:'Category deleted'},
    };
    const label=labels[action]; return label?this.language.choose(label.vi,label.en):action.replaceAll('_',' ');
  }

  protected label(item: { vi: string; en: string }): string { return this.language.choose(item.vi,item.en); }
  protected selectPeriod(value: number): void { this.period.set(value); this.periodOpen.set(false); }
  
  protected readonly engagementChartData = computed(() => {
    const days = this.period();
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days + 1);
    startDate.setHours(0, 0, 0, 0);

    const likes = this.database.table('post_likes').filter(l => l.is_liked && new Date(l.updated_at) >= startDate);
    const comments = this.database.table('comments').filter(c => !c.deleted_at && new Date(c.created_at) >= startDate);

    const data: { date: string; likes: number; comments: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      data.push({ date: dateStr, likes: 0, comments: 0 });
    }

    likes.forEach(l => {
      const dateStr = l.updated_at.slice(0, 10);
      const entry = data.find(d => d.date === dateStr);
      if (entry) entry.likes++;
    });

    comments.forEach(c => {
      const dateStr = c.created_at.slice(0, 10);
      const entry = data.find(d => d.date === dateStr);
      if (entry) entry.comments++;
    });

    return data;
  });

  protected readonly engagementSvgPaths = computed(() => {
    const data = this.engagementChartData();
    const maxValRaw = Math.max(1, ...data.map(d => Math.max(d.likes, d.comments)));
    const maxVal = Math.ceil(maxValRaw / 5) * 5; // Round up to nearest 5 for nicer Y-axis

    const width = 720;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;
    
    const stepX = innerWidth / Math.max(1, data.length - 1);
    const scaleY = (val: number) => paddingY + innerHeight - (val / maxVal) * innerHeight;
    
    let likePath = '';
    let commentPath = '';
    const points: { x: number, ly: number, cy: number, date: string, likes: number, comments: number }[] = [];
    
    data.forEach((d, i) => {
      const x = paddingX + i * stepX;
      const ly = scaleY(d.likes);
      const cy = scaleY(d.comments);
      
      points.push({ x, ly, cy, date: d.date, likes: d.likes, comments: d.comments });

      if (i === 0) {
        likePath = `M${x} ${ly}`;
        commentPath = `M${x} ${cy}`;
      } else {
        likePath += ` L${x} ${ly}`;
        commentPath += ` L${x} ${cy}`;
      }
    });

    const yAxisMarks = [0, Math.round(maxVal / 2), maxVal].map(v => ({ value: v, y: scaleY(v) }));
    
    // Select ~5 equally spaced points for X axis labels
    const xAxisMarks: { x: number, label: string }[] = [];
    const numLabels = Math.min(5, data.length);
    for (let i = 0; i < numLabels; i++) {
      const idx = Math.floor(i * (data.length - 1) / (numLabels - 1));
      xAxisMarks.push({ x: points[idx].x, label: data[idx].date.slice(5) }); // MM-DD
    }
    
    return { likePath, commentPath, maxVal, points, yAxisMarks, xAxisMarks, paddingX, paddingY, width, height };
  });

  protected activeTooltip = signal<{ x: number, y: number, date: string, likes: number, comments: number } | null>(null);
  protected showTooltip(point: any, event: MouseEvent) {
    this.activeTooltip.set({ x: point.x, y: point.ly < point.cy ? point.ly : point.cy, date: point.date, likes: point.likes, comments: point.comments });
  }
  protected hideTooltip() {
    this.activeTooltip.set(null);
  }
}
