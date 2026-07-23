import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { APP_CONFIG, AppLocale } from '../config/app.config';
import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { ZH_KEYS, ZH_UI } from './dynamic-ui-presets';
import { StorageService } from './storage.service';

const UI_MESSAGES = {
  vi: {
    posts: 'Bài viết',
    admin: 'Quản trị',
    writePost: 'Viết bài',
    changeLanguage: 'Đổi ngôn ngữ',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',
    dashboard: 'Bảng điều khiển',
    managePosts: 'Quản lý bài viết',
    manageUsers: 'Quản lý người dùng',
    manageCategories: 'Quản lý danh mục',
    activityLogs: 'Nhật ký hoạt động',
    settings: 'Cài đặt',
    logout: 'Đăng xuất',
  },
  en: {
    posts: 'Posts',
    admin: 'Admin',
    writePost: 'Write a post',
    changeLanguage: 'Change language',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    dashboard: 'Dashboard',
    managePosts: 'Manage posts',
    manageUsers: 'Manage users',
    manageCategories: 'Manage categories',
    activityLogs: 'Activity logs',
    settings: 'Settings',
    logout: 'Log out',
  },
} as const;

export type UiMessageKey = keyof (typeof UI_MESSAGES)['vi'];

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storage = inject(StorageService);
  private readonly database = inject(MockDatabaseService);
  private readonly document = inject(DOCUMENT);
  private readonly revision = signal(0);
  private readonly pendingTranslations = new Set<string>();
  private readonly translators = new Map<string, { translate(value: string): Promise<string> }>();
  private readonly translatorPromises = new Map<string, Promise<{ translate(value: string): Promise<string> }>>();
  private readonly localeState = signal<AppLocale>(this.readInitialLocale());
  private readonly documentLanguageEffect = effect(() => {
    this.document.documentElement.lang = this.localeState();
  });

  readonly locale = this.localeState.asReadonly();
  readonly availableLanguages = computed(() => {
    this.revision();
    return this.database.table('languages').filter((language) => language.is_active && language.is_system_language && language.translation_status === 'READY' && !language.deleted_at);
  });
  readonly currentLanguage = computed(() => this.availableLanguages().find((language) => language.code === this.localeState()) ?? this.availableLanguages()[0]);
  readonly languageId = computed(() => this.currentLanguage()?.id ?? 2);
  readonly alternateLocale = computed<AppLocale>(() => this.availableLanguages().find((language) => language.code !== this.localeState())?.code ?? APP_CONFIG.defaultLocale);

  translate(key: UiMessageKey | string): string {
    this.revision();
    if (this.isChinese() && ZH_KEYS[key]) return ZH_KEYS[key];
    const keys = this.database.table('ui_translation_keys');
    const keyRow = keys.find((item) => item.translation_key === key);
    if (keyRow) {
      const translations = this.database.table('ui_translations');
      const direct = translations.find((item) => item.translation_key_id === keyRow.id && item.language_id === this.languageId());
      if (direct) return direct.translated_value;
      const fallbackId = this.currentLanguage()?.fallback_language_id ?? 1;
      const fallback = translations.find((item) => item.translation_key_id === keyRow.id && item.language_id === fallbackId);
      if (fallback) return fallback.translated_value;
    }
    const legacyLocale = this.localeState() === 'vi' ? 'vi' : 'en';
    return UI_MESSAGES[legacyLocale][key as UiMessageKey] ?? key;
  }

  choose(vietnamese: string, english: string): string {
    this.revision();
    if (this.localeState() === 'vi') return vietnamese;
    if (this.localeState() === 'en') return english;
    if (this.isChinese()) return ZH_UI[english] ?? this.translateChineseParts(english);
    const keyName = `runtime.${this.hash(english)}`;
    const keys = this.database.table('ui_translation_keys');
    const key = keys.find((item) => item.translation_key === keyName);
    if (key) {
      const translated = this.database.table('ui_translations').find((item) => item.translation_key_id === key.id && item.language_id === this.languageId());
      if (translated) return translated.translated_value;
    }
    this.queueTranslation(keyName, vietnamese, english);
    return english;
  }

  chooseObject<T extends Record<string, string>>(vietnamese: T, english: T): T {
    return Object.fromEntries(Object.keys(english).map((key) => [key, this.choose(vietnamese[key], english[key])])) as T;
  }

  setLocale(locale: AppLocale): void {
    if (!this.availableLanguages().some((language) => language.code === locale)) return;
    this.localeState.set(locale);
    this.storage.set('blog-lang', locale);
  }

  toggleLocale(): void {
    const languages = this.availableLanguages();
    const currentIndex = languages.findIndex((language) => language.code === this.localeState());
    this.setLocale(languages[(currentIndex + 1) % languages.length]?.code ?? APP_CONFIG.defaultLocale);
  }

  formatLocale(): string {
    const code = this.localeState();
    return ({ vi: 'vi-VN', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' } as Record<string, string>)[code] ?? code;
  }

  refreshLanguages(): void {
    this.revision.update((value) => value + 1);
    if (!this.availableLanguages().some((language) => language.code === this.localeState())) {
      this.setLocale(this.availableLanguages()[0]?.code ?? APP_CONFIG.defaultLocale);
    }
  }

  private readInitialLocale(): AppLocale {
    const stored = this.storage.get<AppLocale>('blog-lang');
    return stored ?? APP_CONFIG.defaultLocale;
  }

  private queueTranslation(keyName: string, vietnamese: string, english: string): void {
    const target = this.currentLanguage();
    const pendingKey = `${target.code}:${keyName}`;
    if (this.pendingTranslations.has(pendingKey)) return;
    this.pendingTranslations.add(pendingKey);
    void this.autoTranslate(english, target.code).then((translatedValue) => {
      const now = new Date().toISOString();
      const keys = this.database.table('ui_translation_keys');
      let key = keys.find((item) => item.translation_key === keyName);
      if (!key) {
        key = { id: this.database.nextId('ui_translation_keys'), translation_key: keyName, description: vietnamese, is_required: true, created_at: now, updated_at: now };
        keys.push(key);
        this.database.write('ui_translation_keys', keys);
      }
      const translations = this.database.table('ui_translations');
      const sourceValues = [{ languageId: 1, value: english, auto: false }, { languageId: 2, value: vietnamese, auto: false }, { languageId: target.id, value: translatedValue, auto: true }];
      for (const source of sourceValues) {
        if (translations.some((item) => item.language_id === source.languageId && item.translation_key_id === key!.id)) continue;
        translations.push({ id: translations.reduce((maximum, item) => Math.max(maximum, item.id), 0) + 1, language_id: source.languageId, translation_key_id: key.id, translated_value: source.value, is_auto_translated: source.auto, is_reviewed: !source.auto, created_at: now, updated_at: now });
      }
      this.database.write('ui_translations', translations);
      this.revision.update((value) => value + 1);
    }).finally(() => this.pendingTranslations.delete(pendingKey));
  }

  private async autoTranslate(value: string, targetCode: string): Promise<string> {
    const api = (window as unknown as { Translator?: { create(options: { sourceLanguage: string; targetLanguage: string }): Promise<{ translate(value: string): Promise<string> }> } }).Translator;
    if (!api?.create) return value;
    const mapKey = `en:${targetCode}`;
    let translator = this.translators.get(mapKey);
    if (!translator) {
      let pending = this.translatorPromises.get(mapKey);
      if (!pending) {
        pending = api.create({ sourceLanguage: 'en', targetLanguage: targetCode });
        this.translatorPromises.set(mapKey, pending);
      }
      translator = await pending;
      this.translators.set(mapKey, translator);
      this.translatorPromises.delete(mapKey);
    }
    return translator.translate(value);
  }

  private hash(value: string): string {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }

  private translateChineseParts(value: string): string {
    const replacements: Array<[RegExp, string]> = [
      [/\bLast\b/g, '最近'], [/\bdays?\b/g, '天'], [/\bShowing\b/g, '显示'], [/\bof\b/g, '共'],
      [/\bTotal\b/g, '总计'], [/\bPage\b/g, '页'], [/\bPosts?\b/gi, '文章'],
      [/\bUsers?\b/gi, '用户'], [/\bCategories?\b/gi, '分类'], [/\bLanguages?\b/gi, '语言'],
      [/\bManage\b/gi, '管理'], [/\bSearch\b/gi, '搜索'], [/\bNew\b/gi, '新建'],
      [/\bEdit\b/gi, '编辑'], [/\bDelete\b/gi, '删除'], [/\bSave\b/gi, '保存'],
      [/\bStatus\b/gi, '状态'], [/\bTitle\b/gi, '标题'], [/\bAuthor\b/gi, '作者'],
      [/\bCategory\b/gi, '分类'], [/\bDate\b/gi, '日期'], [/\bDefault\b/gi, '默认'],
    ];
    return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
  }

  private isChinese(): boolean {
    const code = this.localeState().toLowerCase();
    return code === 'cn' || code.startsWith('zh');
  }
}
