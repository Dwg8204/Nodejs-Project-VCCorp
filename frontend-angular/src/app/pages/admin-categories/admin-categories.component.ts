import { ChangeDetectionStrategy, Component, computed, CUSTOM_ELEMENTS_SCHEMA, inject, signal, ViewEncapsulation } from '@angular/core';

import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { MockDatabaseService } from '../../data/mock/mock-database.service';
import { CategoryRow, CategoryTranslationRow } from '../../data/mock/mock-schema.model';
import { buildPaginationItems } from '../../shared/utils/pagination';

interface CategoryView {
  category: CategoryRow;
  translation?: CategoryTranslationRow;
  posts: number;
}

interface CategoryFormCopy {
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
}

const CATEGORY_FORM_COPY: Record<string, CategoryFormCopy> = {
  vi: {
    nameLabel: 'Tên danh mục', namePlaceholder: 'VD: Công nghệ',
    descriptionLabel: 'Mô tả', descriptionPlaceholder: 'Mô tả ngắn...',
  },
  en: {
    nameLabel: 'Category name', namePlaceholder: 'e.g. Technology',
    descriptionLabel: 'Description', descriptionPlaceholder: 'Short description...',
  },
  zh: {
    nameLabel: '分类名称', namePlaceholder: '例如：科技',
    descriptionLabel: '描述', descriptionPlaceholder: '简短描述...',
  },
  cn: {
    nameLabel: '分类名称', namePlaceholder: '例如：科技',
    descriptionLabel: '描述', descriptionPlaceholder: '简短描述...',
  },
};

const DICTIONARY: Record<string, Record<string, string>> = {
  'vi:en': {
    'công nghệ': 'Technology', 'đời sống': 'Lifestyle', 'thể thao': 'Sports',
    'giải trí': 'Entertainment', 'kinh doanh': 'Business', 'sức khỏe': 'Health',
    'giáo dục': 'Education', 'du lịch': 'Travel', 'lập trình': 'Programming',
    'thiết kế ux': 'UX Design', 'xã hội': 'Society', 'tin tức': 'News',
    'chính trị': 'Politics', 'văn hóa': 'Culture', 'khoa học': 'Science',
    'kinh tế': 'Economics', 'tài chính': 'Finance', 'ẩm thực': 'Food', 'ô tô': 'Automotive',
    'bất động sản': 'Real Estate', 'pháp luật': 'Law', 'việc làm': 'Careers',
  },
  'en:vi': {
    technology: 'Công nghệ', lifestyle: 'Đời sống', sports: 'Thể thao',
    entertainment: 'Giải trí', business: 'Kinh doanh', health: 'Sức khỏe',
    education: 'Giáo dục', travel: 'Du lịch', programming: 'Lập trình',
    'ux design': 'Thiết kế UX', society: 'Xã hội', social: 'Xã hội',
    news: 'Tin tức', politics: 'Chính trị', culture: 'Văn hóa',
    science: 'Khoa học', economics: 'Kinh tế', economy: 'Kinh tế',
    finance: 'Tài chính', food: 'Ẩm thực',
    automotive: 'Ô tô', 'real estate': 'Bất động sản', law: 'Pháp luật',
    careers: 'Việc làm',
  },
  'vi:zh': {
    'thiết kế ux': '用户体验设计', 'lập trình': '编程', 'xã hội': '社会',
    'tin tức': '新闻', 'kinh tế': '经济', 'công nghệ': '科技', 'đời sống': '生活',
    'thể thao': '体育', 'giải trí': '娱乐', 'kinh doanh': '商业', 'sức khỏe': '健康',
    'giáo dục': '教育', 'du lịch': '旅游', 'chính trị': '政治', 'văn hóa': '文化',
    'khoa học': '科学', 'tài chính': '金融', 'ẩm thực': '美食', 'ô tô': '汽车',
    'bất động sản': '房地产', 'pháp luật': '法律', 'việc làm': '职场',
  },
  'en:zh': {
    'ux design': '用户体验设计', programming: '编程', society: '社会', social: '社会',
    news: '新闻', economics: '经济', economy: '经济', technology: '科技',
    lifestyle: '生活', sports: '体育', entertainment: '娱乐', business: '商业',
    health: '健康', education: '教育', travel: '旅游', politics: '政治',
    culture: '文化', science: '科学', finance: '金融', food: '美食',
    automotive: '汽车', 'real estate': '房地产', law: '法律', careers: '职场',
  },
};

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AdminCategoriesComponent {
  private readonly db = inject(MockDatabaseService);
  private readonly auth = inject(AuthService);
  protected readonly language = inject(LanguageService);
  private readonly revision = signal(0);
  protected readonly search = signal('');
  protected readonly page = signal(1);
  protected readonly pageSize = signal(5);
  protected readonly pageInput = signal(1);
  protected readonly sizeInput = signal(5);
  protected readonly modal = signal<'add' | 'edit' | null>(null);
  protected readonly deleteTarget = signal<CategoryView | null>(null);
  protected readonly editingId = signal<number | null>(null);
  protected readonly sourceLanguageId = signal(2);
  protected readonly name = signal('');
  protected readonly description = signal('');
  protected readonly retranslate = signal(false);
  protected readonly error = signal('');
  protected readonly languages = this.db.table('languages').filter((item) => !item.deleted_at);

  protected readonly rows = computed<CategoryView[]>(() => {
    this.revision();
    const query = this.search().trim().toLocaleLowerCase();
    const translations = this.db.table('category_translation');
    const posts = this.db.table('posts').filter((post) => !post.deleted_at);
    const localeCode = this.language.currentLanguage()?.code?.toLowerCase();
    const displayLanguageId = this.languages.find(
      (item) => item.code.toLowerCase() === localeCode,
    )?.id ?? this.language.contentLanguageId();
    return this.db.table('categories').filter((category) => !category.deleted_at).map((category) => ({
      category,
      translation: translations.find((item) => item.category_id === category.id && item.language_id === displayLanguageId)
        ?? translations.find((item) => item.category_id === category.id),
      posts: posts.filter((post) => post.category_id === category.id).length,
    })).filter((row) => !query || row.translation?.name.toLocaleLowerCase().includes(query));
  });
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.rows().length / this.pageSize())));
  protected readonly pages = computed(() => buildPaginationItems(this.page(), this.totalPages()));
  protected readonly visibleRows = computed(() => this.rows().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));
  protected readonly summary = computed(() => {
    const total=this.rows().length; const from=total?(this.page()-1)*this.pageSize()+1:0; const to=Math.min(this.page()*this.pageSize(),total);
    return this.language.translate('pagination.summary',{from,to,total});
  });
  protected readonly sourceLanguage = computed(() => this.languages.find((item) => item.id === this.sourceLanguageId()) ?? this.languages[0]);
  protected readonly formCopy = computed<CategoryFormCopy>(() => {
    const source = this.sourceLanguage();
    return CATEGORY_FORM_COPY[source?.code.toLocaleLowerCase()] ?? CATEGORY_FORM_COPY['en'];
  });

  constructor() {
    this.repairLegacyMockTranslations();
  }

  protected filter(value: string): void { this.search.set(value); this.page.set(1); }
  protected changePage(value:number):void {const next=Math.min(Math.max(1,value),this.totalPages());this.page.set(next);this.pageInput.set(next);}
  protected applyPage():void {this.changePage(this.pageInput());}
  protected applyPageSize():void {const size=Math.min(100,Math.max(1,Math.trunc(this.sizeInput()||1)));this.pageSize.set(size);this.sizeInput.set(size);this.changePage(1);}
  protected openAdd(): void {
    const localeCode = this.language.currentLanguage()?.code?.toLowerCase();
    const localeLanguageId = this.languages.find((item) => item.code.toLowerCase() === localeCode)?.id;
    this.editingId.set(null); this.sourceLanguageId.set(localeLanguageId ?? this.language.contentLanguageId()); this.name.set(''); this.description.set('');
    this.retranslate.set(false); this.error.set(''); this.modal.set('add');
    requestAnimationFrame(() => this.synchronizeSourceLanguageSelect());
  }
  protected openEdit(row: CategoryView): void {
    const localeCode = this.language.currentLanguage()?.code?.toLowerCase();
    const sourceId = this.languages.find((item) => item.code.toLowerCase() === localeCode)?.id ?? this.language.contentLanguageId();
    const translation = this.db.table('category_translation').find((item) => item.category_id === row.category.id && item.language_id === sourceId) ?? row.translation;
    this.editingId.set(row.category.id); this.sourceLanguageId.set(sourceId); this.name.set(translation?.name ?? '');
    this.description.set(translation?.des ?? ''); this.retranslate.set(false); this.error.set(''); this.modal.set('edit');
  }
  protected changeLanguage(languageId: number): void {
    this.sourceLanguageId.set(languageId);
    if (this.modal() !== 'edit' || !this.editingId()) return;
    const translation = this.db.table('category_translation').find((item) => item.category_id === this.editingId() && item.language_id === languageId);
    this.name.set(translation?.name ?? ''); this.description.set(translation?.des ?? '');
  }
  private synchronizeSourceLanguageSelect(): void {
    const select = document.querySelector<HTMLSelectElement>('.category-modal select');
    if (!select) return;
    const expectedValue = String(this.sourceLanguageId());
    if (select.value !== expectedValue) select.value = expectedValue;
    const wrapper = (select as HTMLSelectElement & { _uiSelectWrapper?: HTMLElement })._uiSelectWrapper;
    const selected = select.options[select.selectedIndex];
    const label = wrapper?.querySelector<HTMLElement>('.ui-select-label');
    if (label && selected) label.textContent = selected.textContent?.trim() ?? '';
    wrapper?.querySelectorAll<HTMLElement>('.ui-select-option').forEach((option) => {
      const active = option.dataset['value'] === expectedValue;
      option.classList.toggle('active', active);
      option.setAttribute('aria-selected', String(active));
    });
  }
  protected save(): void {
    const categoryName = this.name().trim();
    if (!categoryName) { this.error.set(this.language.choose('Vui lòng nhập tên danh mục.','Enter a category name.')); return; }
    const now = new Date().toISOString();
    const categories = this.db.table('categories');
    const translations = this.db.table('category_translation');
    const source = this.sourceLanguage();
    if (!source) return;
    if (this.modal() === 'add') {
      const id = this.db.nextId('categories');
      const category: CategoryRow = { id, source_language_id: source.id, created_at: now, updated_at: now, deleted_at: null };
      categories.push(category);
      this.languages.forEach((target) => translations.push({
        id: translations.reduce((maximum, item) => Math.max(maximum, item.id), 0) + 1,
        category_id: id, language_id: target.id,
        name: this.translate(categoryName, source.code, target.code),
        des: this.translate(this.description().trim(), source.code, target.code),
        is_auto_translated: target.id !== source.id, created_at: now, updated_at: now,
      }));
      this.db.write('categories', categories); this.db.write('category_translation', translations);
      this.writeLog('CATEGORY_CREATED', category, null, { source_language: source.code, translations_created: this.languages.length });
    } else {
      const category = categories.find((item) => item.id === this.editingId());
      if (!category) return;
      const before = structuredClone(category);
      category.source_language_id = source.id; category.updated_at = now;
      this.languages.forEach((target) => {
        const values = { name: this.translate(categoryName, source.code, target.code), des: this.translate(this.description().trim(), source.code, target.code), is_auto_translated: target.id !== source.id, updated_at: now };
        const existing = translations.find((item) => item.category_id === category.id && item.language_id === target.id);
        if (existing) Object.assign(existing, values);
        else translations.push({ id: translations.reduce((maximum, item) => Math.max(maximum, item.id), 0) + 1, category_id: category.id, language_id: target.id, ...values, created_at: now });
      });
      this.db.write('categories', categories); this.db.write('category_translation', translations);
      this.writeLog('CATEGORY_UPDATED', category, before, { source_language: source.code, translations_updated: this.languages.length });
    }
    this.modal.set(null); this.revision.update((value) => value + 1);
  }
  protected remove(): void {
    const target = this.deleteTarget(); if (!target) return;
    const categories = this.db.table('categories'); const category = categories.find((item) => item.id === target.category.id); if (!category) return;
    const before = structuredClone(category); category.deleted_at = new Date().toISOString(); category.updated_at = category.deleted_at;
    this.db.write('categories', categories); this.writeLog('CATEGORY_DELETED', category, before, { affected_posts: target.posts });
    this.deleteTarget.set(null); this.page.set(1); this.revision.update((value) => value + 1);
  }
  private translate(value: string, source: string, target: string): string {
    if (!value || source === target) return value;
    return DICTIONARY[`${source}:${target}`]?.[value.toLocaleLowerCase()] ?? value;
  }

  /**
   * Earlier mock builds stored placeholders such as "[EN] Xã hội".
   * Repair known category names once so existing browser data is usable too.
   */
  private repairLegacyMockTranslations(): void {
    const categories = this.db.table('categories');
    const translations = this.db.table('category_translation');
    let changed = false;
    for (const category of categories) {
      const source = this.languages.find((language) => language.id === category.source_language_id);
      const sourceTranslation = translations.find((item) => item.category_id === category.id && item.language_id === source?.id);
      if (!source || !sourceTranslation) continue;
      for (const target of this.languages.filter((language) => language.id !== source.id)) {
        const targetTranslation = translations.find((item) => item.category_id === category.id && item.language_id === target.id);
        const fallbackTranslation = translations.find((item) => item.category_id === category.id && (item.language_id === 2 || item.language_id === 1));
        const translationSource = sourceTranslation ?? fallbackTranslation;
        if (!translationSource) continue;
        const isPlaceholder = !!targetTranslation && new RegExp(`^\\[${target.code}\\]\\s*`, 'i').test(targetTranslation.name);
        const duplicatesSource = !!targetTranslation && targetTranslation.name.trim().toLocaleLowerCase() === translationSource.name.trim().toLocaleLowerCase();
        if (targetTranslation && !isPlaceholder && !duplicatesSource) continue;
        const sourceCode = this.languages.find((language) => language.id === translationSource.language_id)?.code ?? (translationSource.language_id === 2 ? 'vi' : 'en');
        const translatedName = DICTIONARY[`${sourceCode}:${target.code}`]?.[translationSource.name.toLocaleLowerCase()];
        if (!translatedName) continue;
        const translatedDescription = this.translate(translationSource.des ?? '', sourceCode, target.code);
        if (targetTranslation) {
          targetTranslation.name = translatedName;
          targetTranslation.des = translatedDescription;
          targetTranslation.updated_at = new Date().toISOString();
        } else {
          translations.push({
            id: translations.reduce((maximum, item) => Math.max(maximum, item.id), 0) + 1,
            category_id: category.id, language_id: target.id, name: translatedName,
            des: translatedDescription, is_auto_translated: true,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          });
        }
        changed = true;
      }
    }
    if (changed) this.db.write('category_translation', translations);
  }
  private writeLog(action: string, category: CategoryRow, before: CategoryRow | null, metadata: Record<string, unknown>): void {
    const actor = this.auth.currentUser();
    this.db.appendAuditLog({ id: this.db.nextId('audit_logs'), actor_id: actor?.id ?? null, actor_name: actor?.fullName ?? null, actor_role: actor?.role.nameRole ?? null, action, entity_type: 'CATEGORY', entity_id: category.id, entity_label: this.name(), before_data: before, after_data: structuredClone(category), metadata, ip_address: null, user_agent: navigator.userAgent, created_at: new Date().toISOString() });
  }
}
