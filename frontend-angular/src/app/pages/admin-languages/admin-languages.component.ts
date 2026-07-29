import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { finalize, Observable } from 'rxjs';

import { ApiErrorService } from '../../core/services/api-error.service';
import {
  AdminLanguage,
  LanguageApiService,
  LanguageRecordFilter,
  LanguageSort,
  LanguageTranslationStatus,
} from '../../core/services/language-api.service';
import { LanguageService } from '../../core/services/language.service';
import { buildPaginationItems } from '../../shared/utils/pagination';

const LANGUAGE_COUNTRIES: Record<string, string> = {
  en: 'gb', vi: 'vn', ja: 'jp', ko: 'kr', zh: 'cn', de: 'de', fr: 'fr',
  es: 'es', it: 'it', pt: 'pt', ru: 'ru', th: 'th', id: 'id', ms: 'my',
  ar: 'sa', hi: 'in', nl: 'nl', tr: 'tr',
};

type ConfirmationKind = 'delete' | 'restore' | 'activate' | 'deactivate';

@Component({
  selector: 'app-admin-languages',
  standalone: true,
  templateUrl: './admin-languages.component.html',
  styleUrl: './admin-languages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminLanguagesComponent implements OnInit {
  private readonly api = inject(LanguageApiService);
  private readonly apiErrors = inject(ApiErrorService);
  protected readonly language = inject(LanguageService);

  protected readonly rows = signal<AdminLanguage[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly success = signal('');
  protected readonly error = signal('');

  protected readonly search = signal('');
  protected readonly records = signal<LanguageRecordFilter>('active');
  protected readonly activeFilter = signal('');
  protected readonly sort = signal<LanguageSort>('newest');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(5);
  protected readonly pageInput = signal(1);
  protected readonly sizeInput = signal(5);

  protected readonly modal = signal<'add' | 'edit' | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly code = signal('');
  protected readonly name = signal('');
  protected readonly confirmation = signal<ConfirmationKind | null>(null);
  protected readonly target = signal<AdminLanguage | null>(null);

  private searchTimer?: ReturnType<typeof setTimeout>;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly pages = computed(() =>
    buildPaginationItems(this.page(), this.totalPages()),
  );
  protected readonly visibleRows = computed(() => this.rows());
  protected readonly summary = computed(() => {
    const total = this.total();
    const from = total ? (this.page() - 1) * this.pageSize() + 1 : 0;
    const to = Math.min(this.page() * this.pageSize(), total);
    return this.language.translate('pagination.summary',{from,to,total});
  });

  ngOnInit(): void {
    this.loadRows();
  }

  protected flagUrl(code = this.code()): string {
    const normalized = code.trim().toLowerCase().split('-')[0];
    const country = LANGUAGE_COUNTRIES[normalized];
    return country
      ? `https://flagcdn.com/w40/${country}.png`
      : 'https://flagcdn.com/w40/un.png';
  }

  protected filter(debounce = false): void {
    this.page.set(1);
    this.pageInput.set(1);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (debounce) {
      this.searchTimer = setTimeout(() => this.loadRows(), 300);
    } else {
      this.loadRows();
    }
  }

  protected openAdd(): void {
    this.editingId.set(null);
    this.code.set('');
    this.name.set('');
    this.error.set('');
    this.modal.set('add');
  }

  protected openEdit(item: AdminLanguage): void {
    this.editingId.set(item.id);
    this.code.set(item.code);
    this.name.set(item.name);
    this.error.set('');
    this.modal.set('edit');
  }

  protected closeModal(): void {
    if (this.saving()) return;
    this.modal.set(null);
    this.error.set('');
  }

  protected save(): void {
    if (this.saving()) return;
    const code = this.code().trim().toLowerCase();
    const name = this.name().trim();
    if (!/^[a-z]{2,8}(?:-[a-z0-9]{1,8})*$/.test(code) || name.length < 2) {
      this.error.set(
        this.language.choose(
          'Vui lòng nhập tên và mã ngôn ngữ hợp lệ.',
          'Enter a valid language name and code.',
        ),
      );
      return;
    }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const payload = {
      code,
      name,
      flag: this.flagUrl(code),
    };
    const isAdding = this.modal() === 'add';
    const request: Observable<unknown> =
      isAdding
        ? this.api.create({
            ...payload,
            isActive: true,
            translationStatus: 'READY',
          })
        : this.api.update(this.editingId()!, payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.modal.set(null);
        this.success.set(
          isAdding
            ? this.language.choose('Thêm ngôn ngữ thành công.', 'Language added successfully.')
            : this.language.choose('Cập nhật ngôn ngữ thành công.', 'Language updated successfully.'),
        );
        this.loadRows();
        this.language.refreshLanguages();
      },
      error: (error) => this.showApiError(error),
    });
  }

  protected ask(kind: ConfirmationKind, item: AdminLanguage): void {
    this.target.set(item);
    this.confirmation.set(kind);
    this.error.set('');
  }

  protected cancelConfirmation(): void {
    if (this.saving()) return;
    this.confirmation.set(null);
    this.target.set(null);
  }

  protected applyConfirmation(): void {
    const item = this.target();
    const kind = this.confirmation();
    if (!item || !kind || this.saving()) return;

    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const request: Observable<unknown> =
      kind === 'delete'
        ? this.api.remove(item.id)
        : kind === 'restore'
          ? this.api.restore(item.id)
          : this.api.changeStatus(
              item.id,
              kind === 'activate',
              kind === 'activate' ? 'READY' : 'DISABLED',
            );

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.confirmation.set(null);
        this.target.set(null);
        const messages: Record<ConfirmationKind, [string, string]> = {
          delete: ['Đã xóa ngôn ngữ.', 'Language deleted.'],
          restore: ['Đã khôi phục ngôn ngữ ở trạng thái bản nháp.', 'Language restored as draft.'],
          activate: ['Đã kích hoạt ngôn ngữ.', 'Language activated.'],
          deactivate: ['Đã vô hiệu hóa ngôn ngữ.', 'Language deactivated.'],
        };
        this.success.set(this.language.choose(...messages[kind]));
        this.loadRows();
        this.language.refreshLanguages();
      },
      error: (error) => this.showApiError(error),
    });
  }

  protected changePage(value: number): void {
    const next = Math.min(Math.max(1, value), this.totalPages());
    if (next === this.page() && this.rows().length) return;
    this.page.set(next);
    this.pageInput.set(next);
    this.loadRows();
  }

  protected applyPage(): void {
    this.changePage(this.pageInput());
  }

  protected applyPageSize(): void {
    const size = Math.min(100, Math.max(1, Math.trunc(this.sizeInput() || 1)));
    this.pageSize.set(size);
    this.sizeInput.set(size);
    this.page.set(1);
    this.pageInput.set(1);
    this.loadRows();
  }

  protected statusLabel(status: LanguageTranslationStatus): string {
    const labels: Record<LanguageTranslationStatus, [string, string]> = {
      DRAFT: ['Bản nháp', 'Draft'],
      TRANSLATING: ['Đang dịch', 'Translating'],
      READY: ['Sẵn sàng', 'Ready'],
      FAILED: ['Lỗi dịch', 'Failed'],
      DISABLED: ['Đã tắt', 'Disabled'],
    };
    return this.language.choose(...labels[status]);
  }

  private loadRows(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.list({
      page: this.page(),
      limit: this.pageSize(),
      search: this.search().trim() || undefined,
      records: this.records(),
      isActive: this.activeFilter() === '' ? undefined : this.activeFilter() === 'true',
      sort: this.sort(),
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (response) => {
        this.rows.set(response.data.items);
        this.total.set(response.data.pagination.total);
        const lastPage = Math.max(1, response.data.pagination.totalPages);
        if (this.page() > lastPage) {
          this.page.set(lastPage);
          this.pageInput.set(lastPage);
          this.loadRows();
        }
      },
      error: (error) => {
        this.rows.set([]);
        this.total.set(0);
        this.showApiError(error);
      },
    });
  }

  private showApiError(error: unknown): void {
    const normalized = this.apiErrors.normalize(error);
    const messages: Record<string, [string, string]> = {
      ADMIN_LANGUAGE_CODE_ALREADY_EXISTS: ['Mã ngôn ngữ đã tồn tại.', 'Language code already exists.'],
      ADMIN_LANGUAGE_NOT_FOUND: ['Không tìm thấy ngôn ngữ.', 'Language was not found.'],
      ADMIN_SYSTEM_LANGUAGE_CANNOT_BE_DELETED: ['Không thể xóa ngôn ngữ hệ thống.', 'A system language cannot be deleted.'],
      ADMIN_LAST_ACTIVE_LANGUAGE_MUST_REMAIN: ['Hệ thống phải còn ít nhất một ngôn ngữ hoạt động.', 'At least one active language must remain.'],
      ADMIN_LANGUAGE_USED_AS_FALLBACK: ['Ngôn ngữ đang được dùng làm fallback.', 'The language is being used as a fallback.'],
      ADMIN_LANGUAGE_FALLBACK_INVALID: ['Ngôn ngữ fallback không hợp lệ.', 'Fallback language is invalid.'],
      ADMIN_LANGUAGE_FALLBACK_SELF_REFERENCE: ['Ngôn ngữ không thể fallback về chính nó.', 'A language cannot fall back to itself.'],
      ADMIN_LANGUAGE_FALLBACK_CYCLE: ['Chuỗi fallback tạo thành vòng lặp.', 'The fallback chain creates a cycle.'],
    };
    const translated = messages[normalized.code];
    this.error.set(translated ? this.language.choose(...translated) : normalized.messages.join(' '));
  }
}
