import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { APP_CONFIG, AppLocale } from '../config/app.config';
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
  private readonly document = inject(DOCUMENT);
  private readonly localeState = signal<AppLocale>(this.readInitialLocale());
  private readonly documentLanguageEffect = effect(() => {
    this.document.documentElement.lang = this.localeState();
  });

  readonly locale = this.localeState.asReadonly();
  readonly alternateLocale = computed<AppLocale>(() =>
    this.localeState() === 'vi' ? 'en' : 'vi',
  );

  translate(key: UiMessageKey): string {
    return UI_MESSAGES[this.localeState()][key];
  }

  setLocale(locale: AppLocale): void {
    if (!APP_CONFIG.supportedLocales.includes(locale)) return;
    this.localeState.set(locale);
    this.storage.set('blog-lang', locale);
  }

  toggleLocale(): void {
    this.setLocale(this.alternateLocale());
  }

  private readInitialLocale(): AppLocale {
    const stored = this.storage.get<AppLocale>('blog-lang');
    return stored && APP_CONFIG.supportedLocales.includes(stored)
      ? stored
      : APP_CONFIG.defaultLocale;
  }
}
