import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { APP_CONFIG, AppLocale } from '../config/app.config';
import { ApiClientService } from './api-client.service';
import { StorageService } from './storage.service';

export type UiMessageKey = string;
type TranslationPack = Record<string, string>;
export interface SystemLanguage {
  id:number;code:string;name:string;flag:string|null;is_active:boolean;
  is_system_language:boolean;fallback_language_id:number|null;
  translation_status:'DRAFT'|'TRANSLATING'|'READY'|'DISABLED';
  created_at:string;updated_at:string;deleted_at:string|null;
}
const LOADING_LANGUAGE: SystemLanguage = {
  id: 0, code: '', name: '', flag: null, is_active: false,
  is_system_language: false, fallback_language_id: null,
  translation_status: 'DRAFT', created_at: '', updated_at: '', deleted_at: null,
};

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly storage = inject(StorageService);
  private readonly api = inject(ApiClientService);
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);

  private readonly revision = signal(0);
  private readonly apiLanguages = signal<SystemLanguage[]>([]);
  private readonly packs = signal<Record<string, TranslationPack>>({});
  private readonly pendingPacks = new Set<string>();
  private readonly localeState = signal<AppLocale>(this.readInitialLocale());
  private readonly documentLanguageEffect = effect(() => {
    this.document.documentElement.lang = this.localeState();
  });

  readonly locale = this.localeState.asReadonly();
  readonly availableLanguages = computed(() => {
    this.revision();
    return this.apiLanguages();
  });
  readonly currentLanguage = computed(
    () =>
      this.availableLanguages().find(
        (language) => language.code === this.localeState(),
      ) ?? this.availableLanguages()[0] ?? LOADING_LANGUAGE,
  );
  readonly languageId = computed(() => this.currentLanguage()?.id ?? 2);
  readonly contentLanguageId = computed(() => {
    const code = this.localeState().toLowerCase();
    return this.availableLanguages()
      .find((language) => language.code.toLowerCase() === code)?.id
      ?? this.languageId();
  });
  readonly alternateLocale = computed<AppLocale>(
    () =>
      this.availableLanguages().find(
        (language) => language.code !== this.localeState(),
      )?.code ?? APP_CONFIG.defaultLocale,
  );

  constructor() {
    this.ensurePack('vi');
    this.ensurePack('en');
    this.ensurePack(this.localeState());
    this.refreshLanguages();
  }

  translate(
    key: UiMessageKey,
    parameters?: Record<string, string | number>,
  ): string {
    this.revision();
    const message = (
      this.currentPack()[key]
      ?? this.packFor('en')?.[key]
      ?? key
    );
    if (!parameters) return message;
    return Object.entries(parameters).reduce(
      (value, [name, replacement]) =>
        value.replaceAll(`{${name}}`, String(replacement)),
      message,
    );
  }

  choose(vietnamese: string, english: string): string {
    this.revision();
    const locale = this.localeState().toLowerCase();
    const translated = this.currentPack()[`runtime.${this.hash(english)}`];
    if (translated) return translated;
    if (locale === 'vi') return vietnamese;
    return english;
  }

  chooseObject<T extends Record<string, string>>(
    vietnamese: T,
    english: T,
  ): T {
    return Object.fromEntries(
      Object.keys(english).map((key) => [
        key,
        this.choose(vietnamese[key], english[key]),
      ]),
    ) as T;
  }

  setLocale(locale: AppLocale): void {
    if (
      !this.availableLanguages().some(
        (language) => language.code === locale,
      )
    ) {
      return;
    }
    this.localeState.set(locale);
    this.storage.set('blog-lang', locale);
    this.ensurePack(locale);
  }

  toggleLocale(): void {
    const languages = this.availableLanguages();
    const currentIndex = languages.findIndex(
      (language) => language.code === this.localeState(),
    );
    this.setLocale(
      languages[(currentIndex + 1) % languages.length]?.code
        ?? APP_CONFIG.defaultLocale,
    );
  }

  formatLocale(): string {
    const code = this.localeState();
    return (
      {
        vi: 'vi-VN',
        en: 'en-US',
        zh: 'zh-CN',
        ja: 'ja-JP',
        ko: 'ko-KR',
      } as Record<string, string>
    )[code] ?? code;
  }

  refreshLanguages(): void {
    this.api
      .get<{
        items: Array<{
          id: number;
          code: string;
          name: string;
          flag: string | null;
          fallbackLanguageId: number | null;
        }>;
      }>('languages')
      .subscribe({
        next: (response) => {
          const now = new Date().toISOString();
          this.apiLanguages.set(
            response.data.items.map((item) => ({
              id: item.id,
              code: item.code,
              name: item.name,
              flag: item.flag,
              is_active: true,
              is_system_language: true,
              fallback_language_id: item.fallbackLanguageId,
              translation_status: 'READY',
              created_at: now,
              updated_at: now,
              deleted_at: null,
            })),
          );
          for (const language of response.data.items) {
            this.ensurePack(language.code);
          }
          this.revision.update((value) => value + 1);
          if (
            !this.availableLanguages().some(
              (language) => language.code === this.localeState(),
            )
          ) {
            this.setLocale(
              this.availableLanguages()[0]?.code
                ?? APP_CONFIG.defaultLocale,
            );
          }
        },
      });
  }

  private ensurePack(code: string): void {
    const normalized = code.toLowerCase();
    if (this.packFor(normalized, false) || this.pendingPacks.has(normalized)) {
      return;
    }
    this.pendingPacks.add(normalized);
    this.http
      .get<TranslationPack>(`i18n/${normalized}.json`)
      .subscribe({
        next: (pack) => this.storePack(normalized, pack),
        error: () => {
          const base = normalized.split('-')[0];
          if (base !== normalized && !this.packFor(base, false)) {
            this.http.get<TranslationPack>(`i18n/${base}.json`).subscribe({
              next: (pack) => {
                this.storePack(base, pack);
                this.storePack(normalized, pack);
              },
              error: () => this.finishPack(normalized),
            });
          } else {
            this.finishPack(normalized);
          }
        },
      });
  }

  private storePack(code: string, pack: TranslationPack): void {
    this.packs.update((packs) => ({ ...packs, [code]: pack }));
    this.finishPack(code);
    this.revision.update((value) => value + 1);
  }

  private finishPack(code: string): void {
    this.pendingPacks.delete(code);
  }

  private currentPack(): TranslationPack {
    return this.packFor(this.localeState()) ?? {};
  }

  private packFor(
    code: string,
    allowBase = true,
  ): TranslationPack | undefined {
    const normalized = code.toLowerCase();
    return (
      this.packs()[normalized]
      ?? (allowBase
        ? this.packs()[normalized.split('-')[0]]
        : undefined)
    );
  }

  private readInitialLocale(): AppLocale {
    return this.storage.get<AppLocale>('blog-lang')
      ?? APP_CONFIG.defaultLocale;
  }

  private hash(value: string): string {
    let result = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      result ^= value.charCodeAt(index);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0).toString(36);
  }
}
