import { MockDatabase } from './mock-schema.model';

const now = '2026-07-22T00:00:00.000Z';
const passwordHash = '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6';

export const MOCK_DATABASE_SEED: MockDatabase = {
  role: [
    { id: 1, name_role: 'SUPER_ADMIN', created_at: now },
    { id: 2, name_role: 'BLOG_OWNER', created_at: now },
    { id: 3, name_role: 'AUTHENTICATED_USER', created_at: now },
  ],
  users: [
    { id: 1, user_name: 'admin', email: 'admin@blogproject.com', full_name: 'Super Admin Hệ Thống', phone: '0123456789', avatar: null, cover_image: null, date_of_birth: null, is_active: true, password_hash: passwordHash, email_verified: true, role_id: 1, otp_code: null, otp_created_at: null, otp_ttl_seconds: 180, created_at: now, updated_at: now },
    { id: 2, user_name: 'blogger1', email: 'blogger1@gmail.com', full_name: 'Nguyễn Văn Blogger Một', phone: '0911111111', avatar: null, cover_image: null, date_of_birth: null, is_active: true, password_hash: passwordHash, email_verified: true, role_id: 2, otp_code: null, otp_created_at: null, otp_ttl_seconds: 180, created_at: now, updated_at: now },
    { id: 3, user_name: 'blogger2', email: 'blogger2@gmail.com', full_name: 'Trần Thị Blogger Hai', phone: '0922222222', avatar: null, cover_image: null, date_of_birth: null, is_active: true, password_hash: passwordHash, email_verified: true, role_id: 2, otp_code: null, otp_created_at: null, otp_ttl_seconds: 180, created_at: now, updated_at: now },
    { id: 4, user_name: 'blogger3', email: 'blogger3@gmail.com', full_name: 'Lê Hoàng Blogger Ba', phone: '0933333333', avatar: null, cover_image: null, date_of_birth: null, is_active: true, password_hash: passwordHash, email_verified: true, role_id: 2, otp_code: null, otp_created_at: null, otp_ttl_seconds: 180, created_at: now, updated_at: now },
    { id: 5, user_name: 'blogger4', email: 'blogger4@gmail.com', full_name: 'Phạm Minh Blogger Bốn', phone: '0944444444', avatar: null, cover_image: null, date_of_birth: null, is_active: true, password_hash: passwordHash, email_verified: true, role_id: 2, otp_code: null, otp_created_at: null, otp_ttl_seconds: 180, created_at: now, updated_at: now },
    { id: 6, user_name: 'blogger5', email: 'blogger5@gmail.com', full_name: 'Hoàng Anh Blogger Năm', phone: '0955555555', avatar: null, cover_image: null, date_of_birth: null, is_active: true, password_hash: passwordHash, email_verified: true, role_id: 2, otp_code: null, otp_created_at: null, otp_ttl_seconds: 180, created_at: now, updated_at: now },
    { id: 7, user_name: 'reader1', email: 'reader1@gmail.com', full_name: 'Người Dùng Mẫu', phone: null, avatar: null, cover_image: null, date_of_birth: null, is_active: true, password_hash: passwordHash, email_verified: true, role_id: 3, otp_code: null, otp_created_at: null, otp_ttl_seconds: 180, created_at: now, updated_at: now },
  ],
  languages: [
    { id: 1, code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/gb.png', is_active: true, is_system_language: true, fallback_language_id: 2, translation_status: 'READY', created_at: now, updated_at: now, deleted_at: null },
    { id: 2, code: 'vi', name: 'Tiếng Việt', flag: 'https://flagcdn.com/w40/vn.png', is_active: true, is_system_language: true, fallback_language_id: 1, translation_status: 'READY', created_at: now, updated_at: now, deleted_at: null },
  ],
  ui_translation_keys: [
    'nav.home', 'nav.profile', 'nav.dashboard', 'nav.managePosts', 'nav.manageUsers',
    'nav.manageCategories', 'nav.manageLanguages', 'nav.backToBlog', 'action.search',
    'action.signIn', 'action.getStarted', 'action.logout', 'action.cancel', 'action.confirm',
  ].map((translation_key, index) => ({ id: index + 1, translation_key, description: null, is_required: true, created_at: now, updated_at: now })),
  ui_translations: [
    ['Home','Profile','Dashboard','Manage posts','Manage users','Manage categories','Manage languages','Back to Blog','Search...','Sign In','Get Started','Logout','Cancel','Confirm'],
    ['Trang chủ','Hồ sơ','Bảng điều khiển','Quản lý bài viết','Quản lý người dùng','Quản lý danh mục','Quản lý ngôn ngữ','Về trang Blog','Tìm kiếm...','Đăng nhập','Bắt đầu','Đăng xuất','Hủy','Xác nhận'],
  ].flatMap((values, languageIndex) => values.map((translated_value, keyIndex) => ({ id: languageIndex * 14 + keyIndex + 1, language_id: languageIndex + 1, translation_key_id: keyIndex + 1, translated_value, is_auto_translated: false, is_reviewed: true, created_at: now, updated_at: now }))),
  system_settings: [{ id: 1, default_language_id: 2, posts_per_page: 5, require_post_approval: true, auto_translate_categories: true, auto_translate_posts: true, default_theme: 'system', reduce_motion: false, updated_by: 1, created_at: now, updated_at: now }],
  user_preferences: [],
  categories: [
    { id: 1, source_language_id: 2, created_at: now, updated_at: now, deleted_at: null },
    { id: 2, source_language_id: 2, created_at: now, updated_at: now, deleted_at: null },
  ],
  category_translation: [
    { id: 1, category_id: 1, language_id: 2, name: 'Thiết kế UX', des: 'Trải nghiệm người dùng và giao diện', is_auto_translated: false, created_at: now, updated_at: now },
    { id: 2, category_id: 1, language_id: 1, name: 'UX Design', des: 'User experience and interface design', is_auto_translated: true, created_at: now, updated_at: now },
    { id: 3, category_id: 2, language_id: 2, name: 'Lập trình', des: 'Phát triển phần mềm', is_auto_translated: false, created_at: now, updated_at: now },
    { id: 4, category_id: 2, language_id: 1, name: 'Programming', des: 'Software development', is_auto_translated: true, created_at: now, updated_at: now },
  ],
  posts: [
    { id: 1, author_id: 2, category_id: 1, source_language_id: 2, thumbnail: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=900', status: 'PUBLISHED', rejection_reason: null, submitted_at: '2026-07-05T08:00:00.000Z', reviewed_by: 1, reviewed_at: '2026-07-05T09:00:00.000Z', published_at: '2026-07-05T09:00:00.000Z', created_at: '2026-07-05T08:00:00.000Z', updated_at: '2026-07-05T09:00:00.000Z', deleted_at: null },
    { id: 2, author_id: 2, category_id: 2, source_language_id: 2, thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=900', status: 'PENDING', rejection_reason: null, submitted_at: '2026-07-20T10:00:00.000Z', reviewed_by: null, reviewed_at: null, published_at: null, created_at: '2026-07-20T09:00:00.000Z', updated_at: '2026-07-20T10:00:00.000Z', deleted_at: null },
  ],
  post_translations: [
    { id: 1, post_id: 1, language_id: 2, title: 'Thế nào là kỹ năng viết tốt', content: '<p>Các quy tắc viết nội dung rõ ràng và hữu ích cho người đọc.</p>', is_auto_translated: false, created_at: now, updated_at: now },
    { id: 2, post_id: 1, language_id: 1, title: 'What good writing looks like', content: '<p>Clear and useful writing principles for every reader.</p>', is_auto_translated: true, created_at: now, updated_at: now },
    { id: 3, post_id: 2, language_id: 2, title: 'Hiểu về JavaScript bất đồng bộ', content: '<p>Promise và async/await qua những ví dụ thực tế.</p>', is_auto_translated: false, created_at: now, updated_at: now },
    { id: 4, post_id: 2, language_id: 1, title: 'Understanding asynchronous JavaScript', content: '<p>Promises and async/await through practical examples.</p>', is_auto_translated: true, created_at: now, updated_at: now },
  ],
  comments: [{ id: 1, user_id: 7, post_id: 1, parent_id: null, content: 'Bài viết rất hữu ích!', created_at: now, updated_at: now, deleted_at: null }],
  post_likes: [{ id: 1, post_id: 1, user_id: 7, is_liked: true, created_at: now, updated_at: now }],
  post_bookmarks: [{ id: 1, post_id: 1, user_id: 7, created_at: now }],
  audit_logs: [],
};

export const MOCK_SEED_PASSWORD = '123456';
