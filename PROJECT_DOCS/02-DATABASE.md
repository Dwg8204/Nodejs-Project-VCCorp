# 02. Database và migration

## 1. Tổng quan

- Database mặc định: `vccorp_db`.
- Engine: MySQL, charset `utf8mb4`, collation `utf8mb4_unicode_ci`.
- TypeORM runtime dùng `autoLoadEntities`, `synchronize: false`.
- Migration history nằm trong `typeorm_migrations`.
- `init.sql` chỉ để tham khảo/khởi tạo thủ công; luồng chuẩn là migrations. Không dùng cả hai trên cùng database.

## 2. Sơ đồ quan hệ

```text
role 1 ──────── n users
users 1 ─────── n posts (author_id)
users 1 ─────── n posts (reviewed_by)
users 1 ─────── n comments
users 1 ─────── n post_likes
users 1 ─────── n audit_logs

languages 1 ─── n category_translation
languages 1 ─── n post_translations
languages 1 ─── n posts (source_language_id)
languages 1 ─── n languages (fallback_language_id, self reference)

categories 1 ── n category_translation
categories 1 ── n posts
posts 1 ──────── n post_translations
posts 1 ──────── n comments
posts 1 ──────── n post_likes
comments 1 ───── n comments (parent_id; tối đa hai tầng ở service)
```

## 3. Data dictionary

### `role`

Lưu ba role cố định: `SUPER_ADMIN`, `BLOG_OWNER`, `AUTHENTICATED_USER`. `users.role_id` tham chiếu bảng này.

### `users`

Danh tính, hồ sơ và auth:

- Unique: `user_name`, `email`.
- Hồ sơ: `full_name`, `phone`, `avatar`, `cover_image`, `date_of_birth`.
- Bảo mật: `password_hash`, `is_active`, `email_verified`, `password_changed_at`.
- OTP reset được giữ trực tiếp trong user: `otp_code_hash`, `otp_purpose`, `otp_expires_at`, `otp_attempt_count`, `otp_last_sent_at`.
- `password_hash` và các trường nhạy cảm OTP mặc định không được select bởi entity.
- Phiên đăng nhập và hash refresh token được lưu riêng trong `user_sessions`.

### `user_sessions`

Mỗi lần đăng nhập tạo một phiên. Bảng chỉ lưu SHA-256 hash của refresh token,
thời hạn, thời điểm thu hồi/sử dụng gần nhất, IP và user-agent. Refresh token
nguyên bản chỉ nằm trong HttpOnly cookie và được xoay sau mỗi lần refresh.

### `languages`

Danh sách ngôn ngữ nội dung/hệ thống:

- `code`, `name`, `flag`.
- `is_active`: có đang hoạt động không.
- `is_system_language`: có xuất hiện trong bộ chọn ngôn ngữ public không.
- `translation_status`: `DRAFT`, `TRANSLATING`, `READY`, `DISABLED`.
- `fallback_language_id`: quan hệ tự tham chiếu; code frontend hiện vẫn fallback UI về English nếu thiếu key.
- `deleted_at`: xóa mềm.

### `categories` và `category_translation`

`categories` giữ định danh chung; tên/mô tả theo ngôn ngữ nằm ở `category_translation`:

- `category_id` + `language_id` là một bản dịch.
- `name`, `des`, `is_auto_translated`.
- Migration `PreventDuplicateCategoryNames` ngăn tên danh mục trùng trong cùng ngôn ngữ theo dạng chuẩn hóa.
- Khi tìm kiếm với `language=vi`, service phải lọc/ưu tiên đúng translation tiếng Việt thay vì trộn English.

### `posts` và `post_translations`

`posts` giữ dữ liệu không phụ thuộc ngôn ngữ:

- `author_id`, `category_id`, `thumbnail`, `source_language_id`.
- Workflow: `DRAFT`, `PENDING`, `PUBLISHED`, `REJECTED`.
- Duyệt: `reviewed_by`, `reviewed_at`, `published_at`, `rejection_reason`.
- `deleted_at` cho xóa mềm.

`post_translations` giữ `title`, `content`, `language_id`, `is_auto_translated`. Một bài có thể có nhiều bản dịch.

### `comments`

- `user_id`, `post_id`, `parent_id`, `content`.
- `parent_id=null`: bình luận gốc.
- Reply luôn được service quy về `parent_id` của bình luận gốc nên dữ liệu chỉ có hai cấp.
- Xóa mềm qua `deleted_at`.
- Chỉ chủ comment được xóa. Xóa comment gốc hiện xóa mềm cả root và các reply trực tiếp.

### `post_likes`

- Một record cho cặp user/post.
- `is_liked` cho phép toggle mà không cần liên tục xóa/tạo record.
- Unique/index đảm bảo một user không có nhiều trạng thái like trên cùng bài.

### `audit_logs`

Lưu hành động bảo mật/quản trị:

- Người thực hiện: `actor_id`, snapshot `actor_name`, `actor_role`.
- Hành động/đối tượng: `action`, `entity_type`, `entity_id`, `entity_label`.
- Chi tiết: `metadata`, `before_data`, `after_data` dạng JSON.
- Ngữ cảnh: IP, user agent, thời gian.
- Snapshot tên/role giúp log vẫn đọc được nếu user sau này đổi tên hoặc bị xóa.

## 4. Migration hiện tại

| Thứ tự | File | Chức năng |
|---:|---|---|
| 1 | `1700000000001-ResetLegacySchema.ts` | xóa schema cũ; mang tính phá hủy |
| 2 | `1700000000002-CreateIdentityAndAuth.ts` | role, users, auth/OTP |
| 3 | `1700000000003-CreateLanguages.ts` | languages |
| 4 | `1700000000004-CreateContentSchema.ts` | category/post và translations |
| 5 | `1700000000005-CreateInteractionsAndAudit.ts` | comments, likes, audit |
| 6 | `1700000000006-SeedInitialData.ts` | role, ngôn ngữ, user/dữ liệu nền |
| 7 | `1700000000007-PreventDuplicateCategoryNames.ts` | validation trùng tên ở DB |

## 5. Chạy migration

```powershell
cd backend
npm install
npm run migration:show
npm run migration:run
```

Hoàn tác migration gần nhất:

```powershell
npm run migration:revert
```

Tạo migration rỗng mới:

```powershell
npm run migration:create -- AddSomeFeature
```

Sau đó sửa file sinh ra, viết đầy đủ `up()` và `down()`. Không chỉnh sửa migration đã chạy trên môi trường dùng chung; hãy thêm migration mới.

## 6. Index và hiệu năng

Các index quan trọng bao phủ:

- user theo role/status/created time;
- language public/status/fallback;
- translation theo foreign key/ngôn ngữ;
- post theo status, author, category, publish time;
- comment theo post/time, user/time và parent;
- like theo post/trạng thái;
- audit theo thời gian, actor, action và entity.

Khi thêm filter mới, dùng `EXPLAIN` trên query thực tế trước khi thêm index. Không index mọi cột JSON/text. Với log lớn, luôn phân trang, lọc theo khoảng ngày và tận dụng index thay vì tải toàn bộ về Angular.

## 7. Quy tắc thay đổi schema

1. Sửa/thêm migration.
2. Sửa entity TypeORM tương ứng.
3. Sửa DTO/service/response model.
4. Sửa model/service Angular nếu hợp đồng API đổi.
5. Chạy migration trên database test.
6. Build backend và frontend.
7. Cập nhật tài liệu này và API reference.
