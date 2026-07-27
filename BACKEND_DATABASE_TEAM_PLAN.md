# Kế hoạch Backend, Database, tích hợp Frontend và Deploy

## 1. Nguyên tắc phối hợp

- Nhánh tích hợp chung: `develop`.
- Mỗi người làm trên nhánh riêng và tạo Pull Request vào `develop`.
- Migration là nguồn chuẩn duy nhất của cấu trúc database.
- `synchronize` của TypeORM luôn bằng `false`.
- Người 1 chịu trách nhiệm toàn bộ migration khởi tạo database.
- Sau khi schema ban đầu hoàn thành, mỗi người được tự viết Entity, Repository,
  QueryBuilder hoặc raw SQL cho module backend thuộc phạm vi của mình.
- Không sửa migration đã được merge và chạy trên môi trường chung. Mọi thay đổi
  schema sau đó phải tạo migration mới.
- Mọi API quản trị người dùng, ngôn ngữ, danh mục, bài viết, dashboard và log
  phải nằm dưới `/api/admin`.
- Backend trả error code ổn định; Angular dịch thông báo bằng JSON frontend.

## 2. Schema chính thức

Database `vccorp_db` có đúng 10 bảng nghiệp vụ:

```text
role
users
languages
categories
category_translation
posts
post_translations
comments
post_likes
audit_logs
```

Không sử dụng các bảng:

```text
refresh_tokens
password_reset_tokens
system_settings
user_preferences
ui_translation_keys
ui_translations
post_bookmarks
```

Các tùy chọn giao diện được lưu tại trình duyệt. Bản dịch giao diện được lưu
trong JSON Angular. OTP quên mật khẩu được lưu trực tiếp trong `users`.

## 3. Người 1

### 3.1. Nhánh `feature/database-initial-migrations`

Trách nhiệm:

- Thiết kế toàn bộ 10 bảng.
- Tạo primary key, foreign key, unique/check constraint và index.
- Viết đầy đủ migration `up()` và `down()`.
- Seed role, tài khoản phát triển, Anh–Việt–Trung và danh mục mẫu.
- Kiểm tra migration trên database trống.
- Viết hướng dẫn chạy migration bằng XAMPP/phpMyAdmin.

Nhánh hoàn thành khi:

- `npm run migration:run` thành công.
- Có đúng 10 bảng nghiệp vụ và bảng kỹ thuật `typeorm_migrations`.
- Dữ liệu seed đúng Unicode.
- Backend build thành công.

### 3.2. Nhánh `feature/auth`

Nhánh này bao gồm entity dùng chung và nền tảng backend để Người 2 có thể tái sử
dụng, sau đó mới triển khai Auth.

#### Nền tảng và entity

- Đồng bộ đủ 10 entity với migration.
- Tách cấu hình database thành module dùng chung.
- Cấu hình `ConfigModule`, TypeORM, CORS và ValidationPipe.
- Tạo enum dùng chung cho role, trạng thái bài và trạng thái ngôn ngữ.
- Chuẩn hóa quan hệ giữa entity.
- Tuyệt đối không dùng `synchronize: true`.

#### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/verify-otp
POST /api/auth/reset-password
```

Yêu cầu:

- Hash mật khẩu bằng bcrypt.
- Chỉ dùng access token JWT; không có refresh token.
- Kiểm tra `is_active` ở các request được bảo vệ.
- OTP lưu dạng hash trong `users`.
- Giới hạn thời hạn, số lần nhập và thời gian gửi lại OTP.
- Sau khi reset thành công phải xóa toàn bộ dữ liệu OTP.
- Không trả password hash hoặc OTP trong response.
- Ghi audit log đăng ký, đăng nhập thành công/thất bại, đăng xuất và reset mật
  khẩu.

#### Profile

```text
GET   /api/profile
PATCH /api/profile
```

Cho phép sửa tên, số điện thoại, ngày sinh, URL avatar và URL ảnh bìa. Không cho
phép profile tự sửa role hoặc trạng thái khóa.

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

Ngôn ngữ trong database áp dụng cho danh mục và bài viết. Việc thêm JSON dịch
giao diện Angular không thuộc API ngôn ngữ.

#### Admin audit log

```text
GET /api/admin/logs
GET /api/admin/logs/:id
```

Bộ lọc gồm người thực hiện, action, entity type, entity ID, khoảng ngày, phân
trang và sắp xếp mới nhất. Không lưu mật khẩu, OTP, JWT, ảnh base64 hoặc toàn bộ
nội dung bài viết dài trong log.

## 4. Người 2

### 4.1. Nhánh `feature/backend-content`

Người 2 triển khai toàn bộ nghiệp vụ nội dung trên entity và nền tảng dùng chung
từ `feature/auth`.

#### Public API

```text
GET  /api/languages
GET  /api/categories
GET  /api/posts
GET  /api/posts/:id
GET  /api/posts/:id/comments
POST /api/posts/:id/comments
POST /api/posts/:id/likes
```

Danh sách bài viết hỗ trợ:

```text
page
limit
language
categoryId
search
sort
```

Public API chỉ trả bài `PUBLISHED`.

#### Blog Owner

```text
GET    /api/owner/posts
GET    /api/owner/posts/:id
POST   /api/owner/posts
PATCH  /api/owner/posts/:id
DELETE /api/owner/posts/:id
POST   /api/owner/posts/:id/submit
```

Blog Owner chỉ được sửa bài của mình. Luồng trạng thái:

```text
DRAFT -> PENDING -> PUBLISHED
                  -> REJECTED
```

Blog Owner không được tự chuyển bài sang `PUBLISHED`.

#### Admin danh mục và kiểm duyệt bài

```text
GET    /api/admin/categories
POST   /api/admin/categories
PATCH  /api/admin/categories/:id
DELETE /api/admin/categories/:id
PATCH  /api/admin/categories/:id/restore

GET  /api/admin/posts
GET  /api/admin/posts/:id
POST /api/admin/posts/:id/approve
POST /api/admin/posts/:id/reject
```

Mọi thao tác tạo/sửa/xóa danh mục và duyệt/từ chối bài phải gọi dịch vụ audit
log dùng chung do Người 1 cung cấp.

#### Tương tác, dashboard và ảnh

- Bình luận và trả lời bình luận.
- Like/unlike theo unique `(post_id, user_id)`.
- Bài viết liên quan/gợi ý.
- Dashboard admin từ dữ liệu thật.
- Upload avatar, cover, thumbnail và ảnh nội dung.
- Database chỉ lưu URL ảnh, không lưu base64.

API dashboard:

```text
GET /api/admin/dashboard
```

### 4.2. Nhánh `feature/angular-api-integration`

- Tạo Angular API services theo module.
- Thêm JWT interceptor và error handling.
- Thay mock Auth/Profile.
- Thay mock homepage, article, category và language.
- Thay mock Blog Owner.
- Thay mock Admin.
- Giữ nguyên 100% HTML/CSS/JS behavior đã duyệt.
- Không xóa mock data cho đến khi module API tương ứng ổn định.

### 4.3. Nhánh `feature/deployment`

- Deploy NestJS và cấu hình biến môi trường production.
- Cấu hình CORS/HTTPS.
- Deploy Angular lên GitHub Pages.
- Cấu hình GitHub Actions.
- Smoke test frontend, backend và database.

## 5. API contract dùng chung

Response thành công:

```json
{
  "success": true,
  "data": {},
  "message": "AUTH_LOGIN_SUCCEEDED"
}
```

Response lỗi:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "AUTH_INVALID_CREDENTIALS",
    "details": null
  }
}
```

Phân trang:

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Hai người phải thống nhất DTO và response trước khi Angular ghép API.

## 6. Quy tắc thay đổi database

Sau khi migration ban đầu được merge:

1. Người cần đổi schema viết mô tả thay đổi và lý do.
2. Người 1 kiểm tra ảnh hưởng tới frontend và module của Người 2.
3. Người 1 tạo migration bổ sung.
4. Cả hai kiểm tra `up()` và `down()` trên database phát triển.
5. Merge migration trước code sử dụng cột/bảng mới.

Không sửa trực tiếp database bằng phpMyAdmin mà không có migration tương ứng.

## 7. Thứ tự triển khai và merge

```text
1. feature/database-initial-migrations
2. feature/auth
3. feature/backend-content
4. feature/angular-api-integration
5. feature/deployment
6. release/v1.0.0
7. main
```

Người 2 có thể bắt đầu DTO và API contract song song, nhưng phải cập nhật
`develop` sau khi entity/nền tảng từ `feature/auth` được merge.

## 8. Definition of Done

Một module chỉ hoàn thành khi:

- Build thành công.
- Có validation DTO.
- Có kiểm tra authentication/authorization phù hợp.
- Không trả dữ liệu nhạy cảm.
- Có phân trang cho danh sách.
- Ghi audit log cho hành động quản trị quan trọng.
- Có unit test và e2e test cho luồng chính.
- Swagger/API documentation được cập nhật.
- Không thay đổi schema ngoài migration.
