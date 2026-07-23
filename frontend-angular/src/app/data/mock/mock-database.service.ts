import { inject, Injectable } from '@angular/core';

import { StorageService } from '../../core/services/storage.service';
import { MOCK_DATABASE_SEED } from './mock.seed';
import { MockDatabase, MockTableName } from './mock-schema.model';

const DATABASE_KEY = 'vccorp_angular_mock_database_v1';
const CREDENTIALS_KEY = 'vccorp_angular_mock_credentials_v1';

@Injectable({ providedIn: 'root' })
export class MockDatabaseService {
  private readonly storage = inject(StorageService);

  constructor() {
    if (!this.storage.get<MockDatabase>(DATABASE_KEY)) this.reset();
    this.migrateDynamicLanguages();
  }

  table<K extends MockTableName>(name: K): MockDatabase[K] {
    return structuredClone(this.read()[name]);
  }

  write<K extends MockTableName>(name: K, rows: MockDatabase[K]): void {
    const database = this.read();
    database[name] = structuredClone(rows) as MockDatabase[K];
    this.storage.set(DATABASE_KEY, database);
  }

  nextId<K extends MockTableName>(name: K): number {
    const rows = this.table(name) as Array<{ id?: number }>;
    return rows.reduce((maximum, row) => Math.max(maximum, row.id ?? 0), 0) + 1;
  }

  getRegisteredPassword(email: string): string | null {
    const credentials = this.storage.get<Record<string, string>>(CREDENTIALS_KEY) ?? {};
    return credentials[email.toLowerCase()] ?? null;
  }

  setRegisteredPassword(email: string, password: string): void {
    const credentials = this.storage.get<Record<string, string>>(CREDENTIALS_KEY) ?? {};
    credentials[email.toLowerCase()] = password;
    this.storage.set(CREDENTIALS_KEY, credentials);
  }

  reset(): void {
    this.storage.set(DATABASE_KEY, structuredClone(MOCK_DATABASE_SEED));
    this.storage.set(CREDENTIALS_KEY, {});
  }

  private read(): MockDatabase {
    return this.storage.get<MockDatabase>(DATABASE_KEY) ?? structuredClone(MOCK_DATABASE_SEED);
  }

  private migrateDynamicLanguages(): void {
    const database = this.storage.get<MockDatabase>(DATABASE_KEY) as MockDatabase & {
      ui_translation_keys?: MockDatabase['ui_translation_keys'];
      ui_translations?: MockDatabase['ui_translations'];
    };
    database.ui_translation_keys ??= structuredClone(MOCK_DATABASE_SEED.ui_translation_keys);
    database.ui_translations ??= structuredClone(MOCK_DATABASE_SEED.ui_translations);
    database.languages = database.languages.map((language) => ({
      ...language,
      is_active: language.is_active ?? true,
      is_system_language: language.is_system_language ?? true,
      fallback_language_id: language.fallback_language_id ?? (language.code === 'vi' ? 1 : 2),
      translation_status: language.translation_status ?? 'READY',
    }));
    const chinese = database.languages.find((language) => !language.deleted_at && (language.code === 'cn' || language.code.startsWith('zh')));
    if (chinese) {
      const categoryNames: Record<string, string> = {
        'thiết kế ux': '用户体验设计', 'ux design': '用户体验设计',
        'lập trình': '编程', programming: '编程',
        'xã hội': '社会', society: '社会', social: '社会',
        'tin tức': '新闻', news: '新闻',
        'kinh tế': '经济', economics: '经济', economy: '经济',
      };
      let nextTranslationId = database.category_translation.reduce((maximum, row) => Math.max(maximum, row.id), 0) + 1;
      for (const category of database.categories.filter((row) => !row.deleted_at)) {
        const existing = database.category_translation.find((row) => row.category_id === category.id && row.language_id === chinese.id);
        const source = database.category_translation.find((row) => row.category_id === category.id && row.language_id === 2)
          ?? database.category_translation.find((row) => row.category_id === category.id && row.language_id === 1)
          ?? database.category_translation.find((row) => row.category_id === category.id);
        const translatedName = source ? categoryNames[source.name.trim().toLocaleLowerCase()] : undefined;
        if (!source || !translatedName) continue;
        if (existing) {
          if (!existing.name || existing.name === source.name || /^\[(zh|cn)\]/i.test(existing.name)) existing.name = translatedName;
        } else {
          database.category_translation.push({
            id: nextTranslationId++, category_id: category.id, language_id: chinese.id,
            name: translatedName, des: source.des, is_auto_translated: true,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          });
        }
      }
    }
    this.ensureAuditLogSamples(database);
    this.storage.set(DATABASE_KEY, database);
  }

  private ensureAuditLogSamples(database: MockDatabase): void {
    const samples: Array<[string,string,string,string,unknown,unknown,Record<string,unknown>|null]> = [
      ['AUTH_LOGIN_SUCCEEDED','AUTH','admin@blogproject.com','Super Admin Hệ Thống',null,{success:true},{method:'password'}],
      ['AUTH_LOGIN_FAILED','AUTH','unknown@example.com','System / Guest',null,null,{reason:'INVALID_CREDENTIALS'}],
      ['AUTH_LOGOUT','AUTH','blogger1@gmail.com','Nguyễn Văn Blogger Một',null,null,{session_closed:true}],
      ['POST_CREATED','POST','Bài viết mẫu','Nguyễn Văn Blogger Một',null,{status:'DRAFT'},{source_language:'vi'}],
      ['POST_UPDATED','POST','Bài viết mẫu','Nguyễn Văn Blogger Một',{title:'Tiêu đề cũ'},{title:'Tiêu đề mới'},{fields:['title']}],
      ['POST_SUBMITTED','POST','Hiểu về JavaScript bất đồng bộ','Nguyễn Văn Blogger Một',{status:'DRAFT'},{status:'PENDING'},{workflow:'REVIEW'}],
      ['POST_APPROVED','POST','Thế nào là kỹ năng viết tốt','Super Admin Hệ Thống',{status:'PENDING'},{status:'PUBLISHED'},{reviewed:true}],
      ['POST_REJECTED','POST','Bài viết cần chỉnh sửa','Super Admin Hệ Thống',{status:'PENDING'},{status:'REJECTED'},{reason:'Nội dung cần bổ sung nguồn'}],
      ['POST_DELETED','POST','Bài viết đã xóa','Nguyễn Văn Blogger Một',{deleted_at:null},{deleted_at:'2026-07-18T10:00:00.000Z'},{soft_delete:true}],
      ['CATEGORY_CREATED','CATEGORY','Thiết kế UX','Super Admin Hệ Thống',null,{name:'Thiết kế UX'},{translations_created:3}],
      ['CATEGORY_UPDATED','CATEGORY','Lập trình','Super Admin Hệ Thống',{name:'Lập trình'},{name:'Phát triển phần mềm'},{translations_updated:3}],
      ['CATEGORY_DELETED','CATEGORY','Danh mục cũ','Super Admin Hệ Thống',{deleted_at:null},{deleted_at:'2026-07-17T10:00:00.000Z'},{affected_posts:0}],
      ['LANGUAGE_CREATED','LANGUAGE','Tiếng Trung','Super Admin Hệ Thống',null,{code:'zh'},{code:'zh'}],
      ['LANGUAGE_UPDATED','LANGUAGE','English','Super Admin Hệ Thống',{name:'English'},{name:'English (US)'},{code:'en'}],
      ['LANGUAGE_DELETED','LANGUAGE','Français','Super Admin Hệ Thống',{code:'fr'},{deleted:true},{code:'fr'}],
      ['USER_CREATED','USER','newuser@example.com','Super Admin Hệ Thống',null,{role:'AUTHENTICATED_USER'},{email_verified:false}],
      ['USER_LOCKED','USER','reader1@gmail.com','Super Admin Hệ Thống',{is_active:true},{is_active:false},{reason:'ADMIN_ACTION'}],
      ['USER_UNLOCKED','USER','reader1@gmail.com','Super Admin Hệ Thống',{is_active:false},{is_active:true},null],
      ['USER_ROLE_CHANGED','USER','blogger2@gmail.com','Super Admin Hệ Thống',{role:'AUTHENTICATED_USER'},{role:'BLOG_OWNER'},{approved_by:1}],
      ['SETTINGS_UPDATED','SETTINGS','posts_per_page','Super Admin Hệ Thống',{posts_per_page:5},{posts_per_page:10},{field:'posts_per_page'}],
      ['SETTINGS_RESTORED','SETTINGS','System settings','Super Admin Hệ Thống',{posts_per_page:10},{posts_per_page:5},{restored_defaults:true}],
    ];
    const existing=new Set(database.audit_logs.map((row)=>row.action));
    let id=database.audit_logs.reduce((maximum,row)=>Math.max(maximum,row.id),0)+1;
    samples.forEach((sample,index)=>{
      if(existing.has(sample[0]))return;
      database.audit_logs.push({
        id:id++,actor_id:sample[3]==='System / Guest'?null:1,actor_name:sample[3],actor_role:sample[3]==='System / Guest'?null:'SUPER_ADMIN',
        action:sample[0],entity_type:sample[1],entity_id:index+1,entity_label:sample[2],
        before_data:sample[4],after_data:sample[5],metadata:sample[6],ip_address:'127.0.0.1',
        user_agent:'Angular mock audit seed',created_at:new Date(Date.UTC(2026,6,23-index,9,index,0)).toISOString(),
      });
    });
  }
}
