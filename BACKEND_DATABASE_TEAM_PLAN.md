# Kế hoạch phát triển Database, Backend, tích hợp Angular và Deploy

## 1. Mục tiêu

Frontend Angular cơ bản đã hoàn thành. Giai đoạn tiếp theo bao gồm:

- Xây dựng cơ sở dữ liệu MySQL bằng migration.
- Hoàn thiện backend NestJS.
- Thay mock data trong Angular bằng REST API.
- Kiểm thử toàn bộ luồng nghiệp vụ.
- Deploy database, backend và frontend.

Dự án được chia cho hai người. Người 1 chịu trách nhiệm thiết kế database và toàn bộ migration tạo schema ban đầu. Sau khi schema được tạo, mỗi người được tự viết Entity, Repository, QueryBuilder, raw SQL, Service và Controller cho module backend của mình.

## 2. Công nghệ và nguyên tắc chung

- Frontend: Angular 18.
- Backend: NestJS.
- ORM: TypeORM.
- Database: MySQL.
- `TypeORM synchronize` luôn đặt là `false`.
- Mọi thay đổi cấu trúc database phải được quản lý bằng migration.
- Không sửa migration đã chạy trên môi trường dùng chung; phải tạo migration mới.
- Frontend không truy cập MySQL trực tiếp mà chỉ gọi REST API NestJS.
- Không lưu ảnh Base64 trong MySQL ở production; database chỉ lưu URL ảnh.
- Mọi API quản trị của Super Admin bắt buộc có tiền tố `/api/admin`.

Response API thống nhất:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Response phân trang:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

Response lỗi:

```json
{
  "statusCode": 409,
  "message": "EMAIL_ALREADY_EXISTS",
  "error": "Conflict"
}
```

Backend trả error code ổn định; Angular chịu trách nhiệm dịch thông báo theo ngôn ngữ hiện tại.

---

## 3. Phân công Người 1

### 3.1. Thiết kế toàn bộ database ban đầu

Người 1 thiết kế schema cho các bảng:

```text
role
users
refresh_tokens
password_reset_tokens

languages
ui_translation_keys
ui_translations
system_settings
user_preferences

categories
category_translations

posts
post_translations

comments
post_likes
post_bookmarks

audit_logs
```

Người 1 quyết định:

- Kiểu dữ liệu của từng cột.
- Primary key và auto increment.
- Foreign key.
- Unique constraint.
- Check constraint.
- Index.
- Quy tắc `ON DELETE` và `ON UPDATE`.
- Soft delete.
- Các trường thời gian.
- Quan hệ giữa các bảng.

### 3.2. Viết toàn bộ migration khởi tạo

Migration được lưu tại:

```text
backend/src/database/migrations/
```

Danh sách migration đề xuất:

```text
1700000000001-CreateRoles.ts
1700000000002-CreateUsers.ts
1700000000003-CreateAuthTokens.ts
1700000000004-CreateLanguages.ts
1700000000005-CreateUiTranslations.ts
1700000000006-CreateSystemSettings.ts
1700000000007-CreateUserPreferences.ts
1700000000008-CreateCategories.ts
1700000000009-CreateCategoryTranslations.ts
1700000000010-CreatePosts.ts
1700000000011-CreatePostTranslations.ts
1700000000012-CreateComments.ts
1700000000013-CreatePostLikes.ts
1700000000014-CreatePostBookmarks.ts
1700000000015-CreateAuditLogs.ts
1700000000016-CreateIndexes.ts
1700000000017-SeedInitialData.ts
```

Mỗi migration phải có cả `up()` và `down()`:

```typescript
export class CreatePosts1700000000010 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Tạo bảng, khóa ngoại và index.
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Hoàn tác thay đổi.
  }
}
```

Các lệnh bắt buộc:

```json
{
  "scripts": {
    "migration:create": "typeorm-ts-node-commonjs migration:create",
    "migration:generate": "typeorm-ts-node-commonjs migration:generate",
    "migration:run": "typeorm-ts-node-commonjs migration:run",
    "migration:revert": "typeorm-ts-node-commonjs migration:revert",
    "migration:show": "typeorm-ts-node-commonjs migration:show"
  }
}
```

Người 1 phải kiểm tra migration trên database trống:

```bash
npm run migration:run
npm run migration:show
npm run migration:revert
npm run migration:run
```

### 3.3. Seed dữ liệu ban đầu

Seed tối thiểu gồm:

- Role `SUPER_ADMIN`.
- Role `BLOG_OWNER`.
- Role `AUTHENTICATED_USER`.
- Một tài khoản Super Admin.
- Tiếng Việt.
- English.
- Chinese.
- System settings mặc định.
- UI translation keys bắt buộc.
- UI translations tối thiểu.
- Một số danh mục mẫu và bản dịch.

Không seed audit log giả lên production.

### 3.4. Index quan trọng

Các index tối thiểu:

```sql
CREATE INDEX idx_users_role_active
ON users(role_id, is_active);

CREATE INDEX idx_users_created_at
ON users(created_at);

CREATE INDEX idx_posts_public_feed
ON posts(status, deleted_at, published_at);

CREATE INDEX idx_posts_author_status_created
ON posts(author_id, status, created_at);

CREATE INDEX idx_posts_category_status_published
ON posts(category_id, status, published_at);

CREATE INDEX idx_comments_post_created
ON comments(post_id, created_at);

CREATE INDEX idx_audit_created_at
ON audit_logs(created_at);

CREATE INDEX idx_audit_actor_created
ON audit_logs(actor_id, created_at);

CREATE INDEX idx_audit_action_created
ON audit_logs(action, created_at);

CREATE INDEX idx_audit_entity_created
ON audit_logs(entity_type, entity_id, created_at);
```

### 3.5. Backend do Người 1 thực hiện

Sau khi hoàn thành migration, Người 1 làm các module hệ thống sau.

#### Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me

POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
```

Yêu cầu:

- Hash mật khẩu.
- Access token và refresh token.
- Thu hồi refresh token khi logout.
- Kiểm tra tài khoản bị khóa.
- Rate limit login và OTP.
- Ghi log đăng nhập thành công, thất bại và đăng xuất.

#### Profile

```text
GET   /api/profile
PATCH /api/profile
```

#### Admin quản lý người dùng

```text
GET   /api/admin/users
GET   /api/admin/users/:id
POST  /api/admin/users
PATCH /api/admin/users/:id
PATCH /api/admin/users/:id/role
PATCH /api/admin/users/:id/lock
PATCH /api/admin/users/:id/unlock
```

Không sử dụng các đường dẫn quản trị như:

```text
PATCH /api/users/:id/status
PATCH /api/users/:id/role
```

#### Admin quản lý ngôn ngữ

```text
GET    /api/admin/languages
GET    /api/admin/languages/:id
POST   /api/admin/languages
PATCH  /api/admin/languages/:id
DELETE /api/admin/languages/:id
PATCH  /api/admin/languages/:id/restore
PATCH  /api/admin/languages/:id/status
```

#### Admin settings

```text
GET   /api/admin/settings
PATCH /api/admin/settings
POST  /api/admin/settings/reset
```

#### Admin audit log

```text
GET /api/admin/logs
GET /api/admin/logs/:id
```

Audit log hỗ trợ:

- Tìm người thực hiện.
- Lọc action.
- Lọc entity type.
- Lọc entity ID.
- Lọc khoảng ngày.
- Phân trang.
- Sắp xếp mới nhất trước.
- Xem metadata, before data và after data.

Không ghi ảnh Base64 hoặc toàn bộ nội dung bài dài vào log.

---

## 4. Phân công Người 2

Người 2 không viết bộ migration tạo bảng ban đầu. Sau khi schema hoàn thành, Người 2 được tự do viết:

- TypeORM Entity.
- Repository.
- QueryBuilder.
- Raw SQL.
- Service.
- Controller.
- DTO và Validation.
- Transaction thuộc module của mình.

### 4.1. Public API

```text
GET /api/posts
GET /api/posts/:id
GET /api/posts/:id/related
GET /api/posts/featured

GET /api/categories
GET /api/languages
GET /api/ui-translations/:languageCode
GET /api/settings/public
```

Public posts chỉ trả bài:

```sql
status = 'PUBLISHED'
AND deleted_at IS NULL
```

Query danh sách bài hỗ trợ:

```text
?page=1
&limit=5
&language=vi
&categoryId=1
&search=angular
&sort=newest
```

### 4.2. Blog Owner API

```text
GET    /api/owner/posts
GET    /api/owner/posts/:id
POST   /api/owner/posts
PATCH  /api/owner/posts/:id
DELETE /api/owner/posts/:id
POST   /api/owner/posts/:id/submit
```

Workflow:

```text
DRAFT → PENDING → PUBLISHED
                  ↘ REJECTED

REJECTED → DRAFT hoặc PENDING
```

Quy tắc:

- Blog Owner chỉ quản lý bài của mình.
- Blog Owner không được tự chuyển bài sang `PUBLISHED`.
- Nút xuất bản của Blog Owner gửi bài sang `PENDING`.
- Blog Owner được preview bài của mình.
- Bài chưa duyệt không xuất hiện ở API public.

### 4.3. Admin quản lý bài viết

```text
GET  /api/admin/posts
GET  /api/admin/posts/:id
POST /api/admin/posts/:id/approve
POST /api/admin/posts/:id/reject
```

Khi duyệt hoặc từ chối:

- Kiểm tra trạng thái hiện tại là `PENDING`.
- Ghi `reviewed_by`.
- Ghi `reviewed_at`.
- Ghi `published_at` khi duyệt.
- Ghi lý do khi từ chối.
- Tạo audit log.
- Thực hiện trong transaction.

### 4.4. Admin quản lý danh mục

```text
GET    /api/admin/categories
GET    /api/admin/categories/:id
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
PATCH  /api/admin/categories/:id/restore
```

Khi tạo danh mục:

1. Nhận một ngôn ngữ nguồn.
2. Tạo category.
3. Lưu bản dịch ngôn ngữ nguồn.
4. Dịch sang các ngôn ngữ đang hoạt động.
5. Lưu các bản dịch.
6. Ghi audit log.
7. Sử dụng transaction.

### 4.5. Like, comment và bookmark

```text
PUT    /api/posts/:id/like
DELETE /api/posts/:id/like

PUT    /api/posts/:id/bookmark
DELETE /api/posts/:id/bookmark

GET    /api/posts/:id/comments
POST   /api/posts/:id/comments
POST   /api/comments/:id/replies
PATCH  /api/comments/:id
DELETE /api/comments/:id
```

Like phải dựa trên unique constraint:

```sql
UNIQUE KEY uq_post_likes_post_user (post_id, user_id)
```

### 4.6. Admin dashboard

```text
GET /api/admin/dashboard/summary
GET /api/admin/dashboard/engagement
GET /api/admin/dashboard/post-status
GET /api/admin/dashboard/categories
GET /api/admin/dashboard/top-posts
GET /api/admin/dashboard/recent-activity
GET /api/admin/dashboard/translation-coverage
```

Ví dụ:

```text
GET /api/admin/dashboard/engagement?days=30
```

Biểu đồ phải lấy dữ liệu thật từ MySQL.

### 4.7. Upload ảnh

```text
POST /api/uploads/images
```

Nếu endpoint chỉ dành cho Admin:

```text
POST /api/admin/uploads/images
```

Yêu cầu:

- Chỉ nhận JPEG, PNG và WebP.
- Kiểm tra MIME thực tế.
- Giới hạn dung lượng.
- Nén hoặc resize ảnh khi cần.
- Tạo tên file an toàn.
- Upload lên file/object storage.
- Trả URL cho frontend.
- Database chỉ lưu URL.

### 4.8. Tích hợp Angular

Người 2 thay mock repository bằng HTTP repository:

```text
MockAuthRepository     → HttpAuthRepository
MockPostRepository     → HttpPostRepository
MockAdminRepository    → HttpAdminRepository
MockLanguageRepository → HttpLanguageRepository
```

Không gọi `HttpClient` rải rác trong component. Luồng đề xuất:

```text
Angular Component
    ↓
Angular Service/Repository
    ↓
HttpClient
    ↓
NestJS Controller
    ↓
NestJS Service
    ↓
MySQL
```

Environment development:

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api'
};
```

Environment production:

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.example.com/api'
};
```

---

## 5. Thay đổi database phát sinh sau migration ban đầu

Nếu Người 2 phát hiện thiếu bảng, cột hoặc index:

1. Người 2 mô tả yêu cầu nghiệp vụ.
2. Hai người thống nhất thay đổi schema.
3. Người 1 tạo migration bổ sung.
4. Người 2 tiếp tục code trên schema mới.

Mẫu yêu cầu:

```text
DB CHANGE REQUEST

Nghiệp vụ: Tạo slug cho bài viết
Bảng: posts
Trường: slug
Kiểu mong muốn: VARCHAR
Nullable: false
Unique: true
API sử dụng:
- POST /api/owner/posts
- GET /api/posts/:slug
```

Không sửa trực tiếp migration cũ đã chạy trên môi trường chung.

---

## 6. Quy tắc API Admin

Mọi thao tác quản trị phải nằm dưới `/api/admin`.

Đúng:

```text
PATCH /api/admin/users/:id/lock
PATCH /api/admin/users/:id/role
POST  /api/admin/posts/:id/approve
POST  /api/admin/categories
PATCH /api/admin/settings
GET   /api/admin/logs
```

Sai:

```text
PATCH /api/users/:id/lock
POST  /api/posts/:id/approve
POST  /api/categories/admin
GET   /api/logs
```

Controller NestJS:

```typescript
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
export class AdminUsersController {}
```

---

## 7. Chiến lược branch GitHub

### 7.1. Nhánh chính

```text
main
develop
```

- `main`: mã nguồn ổn định, sẵn sàng deploy.
- `develop`: nhánh tích hợp trước khi phát hành.
- Không code trực tiếp trên `main` hoặc `develop`.

### 7.2. Nhánh Người 1

```text
feature/database-initial-migrations
feature/backend-auth
feature/backend-admin-users
feature/backend-admin-languages
feature/backend-admin-settings
feature/backend-audit-logs
```

Nếu muốn gom module quản trị:

```text
feature/backend-system-management
```

### 7.3. Nhánh Người 2

```text
feature/backend-public-posts
feature/backend-owner-posts
feature/backend-admin-posts
feature/backend-admin-categories
feature/backend-post-interactions
feature/backend-admin-dashboard
feature/backend-image-upload
feature/angular-api-integration
feature/deployment
```

Có thể tách Angular integration:

```text
feature/angular-auth-integration
feature/angular-public-api-integration
feature/angular-owner-api-integration
feature/angular-admin-api-integration
```

### 7.4. Nhánh sửa lỗi

```text
fix/auth-refresh-token
fix/admin-user-lock
fix/post-approval-workflow
fix/angular-api-error-handling
fix/database-migration-order
```

Lỗi production khẩn cấp:

```text
hotfix/login-production-error
```

Nhánh `hotfix` được tạo từ `main` và merge trở lại cả `main` lẫn `develop`.

### 7.5. Nhánh phát hành

```text
release/v1.0.0
```

Nhánh release dùng để:

- Kiểm thử tổng thể.
- Sửa lỗi nhỏ.
- Kiểm tra migration production.
- Kiểm tra biến môi trường.
- Kiểm tra deploy.

### 7.6. Bộ nhánh tối thiểu cho nhóm hai người

Nếu không muốn quản lý quá nhiều branch:

```text
main
develop

feature/database-initial-migrations
feature/backend-system-management
feature/backend-content
feature/angular-api-integration
feature/deployment
```

Phân công:

- Người 1:
  - `feature/database-initial-migrations`
  - `feature/backend-system-management`
- Người 2:
  - `feature/backend-content`
  - `feature/angular-api-integration`
  - `feature/deployment`

---

## 8. Thứ tự merge đề xuất

```text
1. feature/database-initial-migrations
2. feature/backend-auth
3. feature/backend-admin-users
4. feature/backend-admin-languages
5. feature/backend-admin-settings
6. feature/backend-public-posts
7. feature/backend-admin-categories
8. feature/backend-owner-posts
9. feature/backend-admin-posts
10. feature/backend-post-interactions
11. feature/backend-audit-logs
12. feature/backend-admin-dashboard
13. feature/backend-image-upload
14. feature/angular-api-integration
15. feature/deployment
16. release/v1.0.0
17. main
```

Mỗi feature branch phải tạo Pull Request vào `develop`.

---

## 9. Lộ trình triển khai

### Đợt 1 — Database và nền tảng

Người 1:

- Thiết kế ERD.
- Viết toàn bộ migration ban đầu.
- Viết seed.
- Tạo index.
- Kiểm tra migration run/revert.
- Bắt đầu Auth.

Người 2:

- Chốt API contract.
- Chuẩn hóa DTO và response.
- Chuẩn bị các module nội dung.
- Tạo Angular service/repository interface.
- Chưa xóa mock data.

### Đợt 2 — Auth, user và ngôn ngữ

Người 1:

- Auth.
- Profile.
- Admin users.
- Admin languages.
- Settings.

Người 2:

- Public category.
- Public post.
- Angular auth integration.
- Angular public API integration.

### Đợt 3 — Blog Owner và Admin moderation

Người 1:

- Audit log.
- Refresh token.
- Security.

Người 2:

- Owner posts.
- Admin posts.
- Category management.
- Upload ảnh.
- Tích hợp Angular Owner và Admin.

### Đợt 4 — Tương tác và dashboard

Người 1:

- Tối ưu audit query.
- Kiểm tra index.
- Hỗ trợ các migration bổ sung.

Người 2:

- Like.
- Comment.
- Bookmark.
- Related posts.
- Dashboard.
- Tích hợp toàn bộ Angular.

### Đợt 5 — Kiểm thử và deploy

Người 1:

- Tạo MySQL production.
- Chạy migration.
- Backup database.
- Kiểm tra index và rollback.

Người 2:

- Deploy NestJS.
- Cấu hình CORS và HTTPS.
- Deploy Angular.
- Cấu hình GitHub Actions.
- Smoke test.

---

## 10. Deploy

### 10.1. Database

1. Tạo MySQL production.
2. Tạo database user riêng, không dùng `root`.
3. Backup trước mỗi đợt migration.
4. Chạy:

```bash
npm run migration:show
npm run migration:run
```

5. Không chạy `init.sql` trên database đang có dữ liệu.

### 10.2. Backend

Biến môi trường:

```env
NODE_ENV=production
PORT=3000

DB_HOST=
DB_PORT=3306
DB_USER=
DB_PASSWORD=
DB_NAME=vccorp_db

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

FRONTEND_URL=https://<username>.github.io/Nodejs-Project-VCCorp/
```

Backend production cần:

- HTTPS.
- CORS đúng domain frontend.
- ValidationPipe.
- Rate limit.
- Không trả password hash.
- Health endpoint:

```text
GET /api/health
```

### 10.3. Angular trên GitHub Pages

Build:

```bash
npm run build:github
```

Cấu hình production:

```typescript
apiBaseUrl: 'https://your-backend-domain/api'
```

Nếu dùng path routing, artifact GitHub Pages cần fallback `404.html`. Có thể sao chép `index.html` thành `404.html` sau khi build hoặc chuyển sang hash routing.

---

## 11. Checklist Pull Request

### Pull Request migration

- [ ] Migration chạy được trên database trống.
- [ ] Có `up()` và `down()`.
- [ ] Migration revert được.
- [ ] Không bật `synchronize`.
- [ ] Foreign key đúng.
- [ ] Index đúng.
- [ ] Seed không chứa dữ liệu nhạy cảm production.

### Pull Request backend

- [ ] Controller đúng prefix.
- [ ] API Admin sử dụng `/api/admin`.
- [ ] Có Guard và Role Guard.
- [ ] DTO có validation.
- [ ] Có phân trang cho danh sách.
- [ ] Không trả password hash.
- [ ] Có transaction cho nghiệp vụ nhiều bước.
- [ ] Có audit log cho hành động quản trị.
- [ ] Backend build thành công.

### Pull Request Angular integration

- [ ] Không làm thay đổi giao diện đã hoàn thành.
- [ ] Không gọi `HttpClient` rải rác trong component.
- [ ] Có loading state.
- [ ] Có error state.
- [ ] Có xử lý 401, 403, 404 và 500.
- [ ] Không còn đọc mock data ở module đã tích hợp.
- [ ] Desktop và mobile hoạt động đúng.
- [ ] Angular build thành công.

---

## 12. Tiêu chí hoàn thành

- [ ] Database tạo được hoàn toàn bằng migration.
- [ ] Migration có thể run và revert.
- [ ] `synchronize` luôn là `false`.
- [ ] Admin API đều nằm dưới `/api/admin`.
- [ ] Angular không còn phụ thuộc `MockDatabaseService`.
- [ ] Refresh trang không mất dữ liệu.
- [ ] Blog Owner gửi bài sang `PENDING`.
- [ ] Chỉ Super Admin được duyệt và từ chối bài.
- [ ] Bài chưa duyệt không xuất hiện ở API public.
- [ ] Ngôn ngữ mới hoạt động động trên toàn hệ thống.
- [ ] Dashboard sử dụng dữ liệu thật.
- [ ] Audit log được lưu trong MySQL.
- [ ] Ảnh được lưu bằng URL thay vì Base64.
- [ ] GitHub Pages gọi được backend HTTPS.
- [ ] CORS production đúng domain.
- [ ] Có backup và rollback database.
- [ ] Có API documentation hoặc Swagger.
- [ ] Có smoke test sau deploy.

