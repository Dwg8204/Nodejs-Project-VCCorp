import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, ViewEncapsulation } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { LanguageRow } from '../../data/mock/mock-schema.model';
import { buildPaginationItems } from '../../shared/utils/pagination';

const LANGUAGE_COUNTRIES: Record<string, string> = {
  en: 'gb', vi: 'vn', ja: 'jp', ko: 'kr', zh: 'cn', de: 'de', fr: 'fr',
  es: 'es', it: 'it', pt: 'pt', ru: 'ru', th: 'th', id: 'id', ms: 'my',
  ar: 'sa', hi: 'in', nl: 'nl', tr: 'tr',
};
const UI_PRESETS: Record<string, string[]> = {
  zh: ['首页','个人资料','控制面板','管理文章','管理用户','管理分类','管理语言','返回博客','搜索...','登录','开始使用','退出登录','取消','确认'],
  ja: ['ホーム','プロフィール','ダッシュボード','記事管理','ユーザー管理','カテゴリ管理','言語管理','ブログに戻る','検索...','ログイン','始める','ログアウト','キャンセル','確認'],
  ko: ['홈','프로필','대시보드','게시물 관리','사용자 관리','카테고리 관리','언어 관리','블로그로 돌아가기','검색...','로그인','시작하기','로그아웃','취소','확인'],
  fr: ['Accueil','Profil','Tableau de bord','Gérer les articles','Gérer les utilisateurs','Gérer les catégories','Gérer les langues','Retour au blog','Rechercher...','Connexion','Commencer','Déconnexion','Annuler','Confirmer'],
};
const ZH_CATEGORY_NAMES: Record<string, string> = {
  'thiết kế ux': '用户体验设计', 'ux design': '用户体验设计',
  'lập trình': '编程', programming: '编程', 'xã hội': '社会', society: '社会',
  'tin tức': '新闻', news: '新闻', 'kinh tế': '经济', economics: '经济',
};

@Component({
  selector: 'app-admin-languages',
  standalone: true,
  templateUrl: './admin-languages.component.html',
  styleUrl: './admin-languages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminLanguagesComponent {
  private readonly db = inject(MockDatabaseService);
  private readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  private readonly revision = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(5);
  protected readonly pageInput = signal(1);
  protected readonly sizeInput = signal(5);
  protected readonly modal = signal<'add' | 'edit' | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly code = signal('');
  protected readonly name = signal('');
  protected readonly error = signal('');
  protected readonly confirmation = signal<'default' | 'delete' | null>(null);
  protected readonly target = signal<LanguageRow | null>(null);

  protected readonly settings = computed(() => { this.revision(); return this.db.table('system_settings')[0]; });
  protected readonly rows = computed(() => { this.revision(); return this.db.table('languages').filter((item) => !item.deleted_at); });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize())));
  protected readonly pages = computed(() => buildPaginationItems(this.page(), this.totalPages()));
  protected readonly visibleRows = computed(() => this.rows().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  protected readonly summary = computed(() => {
    const total=this.rows().length; const from=total?(this.page()-1)*this.pageSize()+1:0; const to=Math.min(this.page()*this.pageSize(),total);
    return this.language.choose(`Hiển thị ${from}–${to} trong tổng số ${total}`,`Showing ${from}–${to} of ${total}`);
  });

  constructor() {
    this.db.table('languages').filter((item) => !item.deleted_at).forEach((item) => this.createUiTranslations(item));
    this.language.refreshLanguages();
  }

  protected isDefault(item: LanguageRow): boolean { return item.id === this.settings()?.default_language_id; }
  protected changePage(value:number):void {const next=Math.min(Math.max(1,value),this.totalPages());this.page.set(next);this.pageInput.set(next);}
  protected applyPage():void {this.changePage(this.pageInput());}
  protected applyPageSize():void {const size=Math.min(100,Math.max(1,Math.trunc(this.sizeInput()||1)));this.pageSize.set(size);this.sizeInput.set(size);this.changePage(1);}
  protected flagUrl(code = this.code()): string {
    const country = LANGUAGE_COUNTRIES[code.trim().toLowerCase()];
    return country ? `https://flagcdn.com/w40/${country}.png` : 'https://flagcdn.com/w40/un.png';
  }
  protected openAdd(): void { this.editingId.set(null); this.code.set(''); this.name.set(''); this.error.set(''); this.modal.set('add'); }
  protected openEdit(item: LanguageRow): void { this.editingId.set(item.id); this.code.set(item.code); this.name.set(item.name); this.error.set(''); this.modal.set('edit'); }
  protected ask(kind: 'default' | 'delete', item: LanguageRow): void {
    if (kind === 'delete' && this.isDefault(item)) return;
    this.target.set(item); this.confirmation.set(kind);
  }
  protected save(): void {
    const code = this.code().trim().toLowerCase();
    const name = this.name().trim();
    if (!/^[a-z]{2,5}$/.test(code) || !name) {
      this.error.set(this.language.choose('Vui lòng nhập tên và mã ngôn ngữ gồm 2–5 chữ cái.','Enter a name and a 2–5 letter language code.'));
      return;
    }
    const languages = this.db.table('languages');
    if (languages.some((item) => !item.deleted_at && item.code === code && item.id !== this.editingId())) {
      this.error.set(this.language.choose('Mã ngôn ngữ này đã tồn tại.','This language code already exists.'));
      return;
    }
    const now = new Date().toISOString();
    if (this.modal() === 'add') {
      const item: LanguageRow = { id: this.db.nextId('languages'), code, name, flag: this.flagUrl(code), is_active: true, is_system_language: true, fallback_language_id: this.settings()?.default_language_id ?? 2, translation_status: 'READY', created_at: now, updated_at: now, deleted_at: null };
      languages.push(item); this.db.write('languages', languages); this.createUiTranslations(item); this.createCategoryTranslations(item); this.log('LANGUAGE_CREATED', item, null, null);
    } else {
      const item = languages.find((language) => language.id === this.editingId());
      if (!item) return;
      const before = structuredClone(item);
      Object.assign(item, { code, name, flag: this.flagUrl(code), is_active: true, is_system_language: true, translation_status: 'READY', updated_at: now });
      this.db.write('languages', languages); this.log('LANGUAGE_UPDATED', item, before, null);
    }
    this.language.refreshLanguages(); this.modal.set(null); this.revision.update((value) => value + 1);
  }
  protected applyConfirmation(): void {
    const target = this.target(); if (!target) return;
    if (this.confirmation() === 'default') {
      const settings = this.db.table('system_settings');
      const before = structuredClone(settings[0]);
      settings[0].default_language_id = target.id; settings[0].updated_at = new Date().toISOString();
      settings[0].updated_by = this.auth.currentUser()?.id ?? null;
      this.db.write('system_settings', settings);
      this.log('LANGUAGE_DEFAULT_CHANGED', target, before, settings[0]);
    } else {
      const languages = this.db.table('languages');
      const item = languages.find((language) => language.id === target.id);
      if (!item || this.isDefault(item)) return;
      const before = structuredClone(item); item.deleted_at = new Date().toISOString(); item.updated_at = item.deleted_at;
      this.db.write('languages', languages);
      this.db.write('category_translation', this.db.table('category_translation').filter((translation) => translation.language_id !== item.id));
      this.db.write('post_translations', this.db.table('post_translations').filter((translation) => translation.language_id !== item.id));
      this.db.write('ui_translations', this.db.table('ui_translations').filter((translation) => translation.language_id !== item.id));
      this.log('LANGUAGE_DELETED', item, before, { code: item.code });
      this.page.set(1);
    }
    this.language.refreshLanguages(); this.confirmation.set(null); this.target.set(null); this.revision.update((value) => value + 1);
  }
  private createUiTranslations(language: LanguageRow): void {
    const keys = this.db.table('ui_translation_keys');
    const translations = this.db.table('ui_translations');
    const fallback = translations.filter((item) => item.language_id === language.fallback_language_id);
    const preset = UI_PRESETS[language.code];
    keys.forEach((key, index) => {
      if (translations.some((item) => item.language_id === language.id && item.translation_key_id === key.id)) return;
      translations.push({ id: translations.reduce((maximum, item) => Math.max(maximum, item.id), 0) + 1, language_id: language.id, translation_key_id: key.id, translated_value: preset?.[index] ?? fallback.find((item) => item.translation_key_id === key.id)?.translated_value ?? key.translation_key, is_auto_translated: true, is_reviewed: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    });
    this.db.write('ui_translations', translations);
  }
  private createCategoryTranslations(language: LanguageRow): void {
    if (language.code !== 'cn' && !language.code.startsWith('zh')) return;
    const translations = this.db.table('category_translation');
    let nextId = translations.reduce((maximum, item) => Math.max(maximum, item.id), 0) + 1;
    for (const category of this.db.table('categories').filter((item) => !item.deleted_at)) {
      if (translations.some((item) => item.category_id === category.id && item.language_id === language.id)) continue;
      const source = translations.find((item) => item.category_id === category.id && item.language_id === 2)
        ?? translations.find((item) => item.category_id === category.id && item.language_id === 1);
      const translatedName = source && ZH_CATEGORY_NAMES[source.name.trim().toLocaleLowerCase()];
      if (!source || !translatedName) continue;
      translations.push({ id: nextId++, category_id: category.id, language_id: language.id, name: translatedName, des: source.des, is_auto_translated: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    }
    this.db.write('category_translation', translations);
  }
  private log(action: string, item: LanguageRow, before: unknown, after: unknown): void {
    const actor = this.auth.currentUser(); const logs = this.db.table('audit_logs');
    logs.push({ id: this.db.nextId('audit_logs'), actor_id: actor?.id ?? null, actor_name: actor?.fullName ?? null, actor_role: actor?.role.nameRole ?? null, action, entity_type: 'LANGUAGE', entity_id: item.id, entity_label: item.name, before_data: before, after_data: after ?? structuredClone(item), metadata: { code: item.code }, ip_address: null, user_agent: navigator.userAgent, created_at: new Date().toISOString() });
    this.db.write('audit_logs', logs);
  }
}
