export interface RoleRow {
  id: number;
  name_role: 'SUPER_ADMIN' | 'BLOG_OWNER' | 'AUTHENTICATED_USER';
  created_at: string;
}

export interface UserRow {
  id: number;
  user_name: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar: string | null;
  cover_image: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  password_hash: string;
  email_verified: boolean;
  role_id: number;
  otp_code: string | null;
  otp_created_at: string | null;
  otp_ttl_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface LanguageRow {
  id: number;
  code: string;
  name: string;
  flag: string | null;
  is_active: boolean;
  is_system_language: boolean;
  fallback_language_id: number | null;
  translation_status: 'DRAFT' | 'TRANSLATING' | 'READY' | 'DISABLED';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SystemSettingsRow {
  id: 1;
  default_language_id: number;
  posts_per_page: number;
  require_post_approval: boolean;
  auto_translate_categories: boolean;
  auto_translate_posts: boolean;
  default_theme: 'system' | 'light' | 'dark';
  reduce_motion: boolean;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferenceRow {
  user_id: number;
  language_id: number | null;
  posts_per_page: number | null;
  theme: 'system' | 'light' | 'dark' | null;
  reduce_motion: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: number;
  source_language_id: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CategoryTranslationRow {
  id: number;
  category_id: number;
  language_id: number;
  name: string;
  des: string | null;
  is_auto_translated: boolean;
  created_at: string;
  updated_at: string;
}

export type PostStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED';

export interface PostRow {
  id: number;
  author_id: number;
  category_id: number;
  source_language_id: number | null;
  thumbnail: string;
  status: PostStatus;
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PostTranslationRow {
  id: number;
  post_id: number;
  language_id: number;
  title: string;
  content: string;
  is_auto_translated: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentRow {
  id: number;
  user_id: number;
  post_id: number;
  parent_id: number | null;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PostLikeRow {
  id: number;
  post_id: number;
  user_id: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostBookmarkRow {
  id: number;
  post_id: number;
  user_id: number;
  created_at: string;
}

export interface AuditLogRow {
  id: number;
  actor_id: number | null;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  entity_label: string | null;
  before_data: unknown;
  after_data: unknown;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface MockDatabase {
  role: RoleRow[];
  users: UserRow[];
  languages: LanguageRow[];
  system_settings: SystemSettingsRow[];
  user_preferences: UserPreferenceRow[];
  categories: CategoryRow[];
  category_translation: CategoryTranslationRow[];
  posts: PostRow[];
  post_translations: PostTranslationRow[];
  comments: CommentRow[];
  post_likes: PostLikeRow[];
  post_bookmarks: PostBookmarkRow[];
  audit_logs: AuditLogRow[];
}

export type MockTableName = keyof MockDatabase;
