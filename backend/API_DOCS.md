# VCCorp Backend API

Base URL local:

```text
http://localhost:3000/api
```

Backend trả message/error code ổn định để Angular dịch bằng JSON giao diện.

## Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json
```

```json
{
  "userName": "reader02",
  "fullName": "Nguyễn Văn A",
  "email": "reader02@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

Tài khoản tự đăng ký luôn nhận role `AUTHENTICATED_USER`.

### Login

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@blogproject.com",
  "password": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "AUTH_LOGIN_SUCCEEDED",
  "data": {
    "user": {},
    "accessToken": "..."
  }
}
```

### Current user

```http
GET /api/auth/me
Authorization: Bearer <accessToken>
```

### Logout

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
```

Không có refresh token/blacklist. Logout ghi audit log, còn Angular chịu trách
nhiệm xóa access token. Token hết hiệu lực khi hết hạn hoặc sau khi mật khẩu
người dùng được đổi.

## Password reset

### Request OTP

```http
POST /api/auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "reader02@example.com"
}
```

Ở `NODE_ENV=development`, response có `developmentOtp` để kiểm thử local. Ở
production, API không trả OTP; cần nối `OtpDeliveryService` với nhà cung cấp
email trước khi deploy.

### Verify OTP

```http
POST /api/auth/verify-otp
Content-Type: application/json
```

```json
{
  "email": "reader02@example.com",
  "otp": "123456"
}
```

Response trả `resetToken` sống 5 phút.

### Reset password

```http
POST /api/auth/reset-password
Content-Type: application/json
```

```json
{
  "resetToken": "<token nhận từ verify-otp>",
  "newPassword": "NewPassword123",
  "confirmPassword": "NewPassword123"
}
```

## Phân quyền dùng chung

Endpoint chỉ cần đăng nhập:

```typescript
@UseGuards(JwtAuthGuard)
```

Endpoint dành cho Blog Owner:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.BlogOwner)
```

Endpoint cho Super Admin:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.SuperAdmin)
```

Lấy người dùng hiện tại:

```typescript
getProfile(@CurrentUser() user: AuthenticatedUser) {
  return this.service.findProfile(user.id);
}
```

Người 2 phải dùng các guard/decorator này, không tạo thêm bản sao trong module
nội dung.

---

## API Người 2 – Content Module

> Script dev: `npm run dev` (watch mode) hoặc `npm run start` (một lần).  
> Base URL local: `http://localhost:3000/api`

### Cách test nhanh

1. **Đảm bảo MySQL đang chạy** (XAMPP → Start Apache + MySQL).
2. **Chạy migration** (lần đầu): `npm run migration:run`
3. **Khởi động server**: `npm run dev`
4. **Dùng Postman / Thunder Client / curl** để gọi API.
5. **Lấy token**: gọi `POST /api/auth/login` → copy `accessToken` → dán vào header `Authorization: Bearer <token>`.

---

## Public – Languages

### Lấy danh sách ngôn ngữ (tạm thời)

```http
GET /api/public/languages
```

> ⚠️ Route tạm thời. Sau khi Người 1 tách `/api/languages` thành public/admin,
> sẽ chuyển về `GET /api/languages`.

Query params (tuỳ chọn):

```text
page    – số trang (mặc định 1)
limit   – số bản ghi/trang (mặc định 10)
search  – tìm theo code hoặc name
```

Response:

```json
{
  "success": true,
  "data": {
    "languages": [],
    "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
  }
}
```

---

## Public – Categories

### Lấy danh sách danh mục (tạm thời)

```http
GET /api/public/categories
```

> ⚠️ Route tạm thời. Sau khi Người 1 tách `/api/categories` thành public/admin,
> sẽ chuyển về `GET /api/categories`.

Query params (tuỳ chọn):

```text
page     – số trang (mặc định 1)
limit    – số bản ghi/trang (mặc định 10)
search   – tìm theo tên bản dịch
```

---

## Public – Posts

### Danh sách bài viết

```http
GET /api/posts
```

Chỉ trả bài `PUBLISHED`. Query params:

```text
page        – số trang (mặc định 1)
limit       – tối đa 50 (mặc định 10)
language    – mã ngôn ngữ, ví dụ: vi, en, zh
categoryId  – lọc theo danh mục
search      – tìm trong tiêu đề bản dịch
sort        – newest | oldest | popular (mặc định newest)
```

Response mẫu:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "1",
        "thumbnail": "https://...",
        "status": "PUBLISHED",
        "publishedAt": "2026-07-28T...",
        "translations": [...],
        "category": {...},
        "author": { "id": 1, "fullName": "Nguyễn Văn A", "avatar": null },
        "likesCount": 12,
        "commentsCount": 3
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

### Chi tiết bài viết

```http
GET /api/posts/:id
```

Trả bài `PUBLISHED` kèm translations, category, author, likesCount, commentsCount.

---

## Public – Comments

### Danh sách bình luận của bài viết

```http
GET /api/posts/:id/comments
```

Trả root comments (không có `parentId`), kèm `repliesCount`. Query params:

```text
page   – mặc định 1
limit  – mặc định 20
```

### Đăng bình luận

```http
POST /api/posts/:id/comments
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "content": "Bài viết rất hay!",
  "parentId": null
}
```

Để trả lời một bình luận khác, truyền `parentId` là id của comment cha.

Response:

```json
{
  "success": true,
  "message": "COMMENT_CREATED",
  "data": { "id": "1", "content": "...", "userId": 2, "postId": "1" }
}
```

---

## Public – Likes

### Like / Unlike bài viết

```http
POST /api/posts/:id/likes
Authorization: Bearer <accessToken>
```

Gọi lần đầu → like. Gọi lại → unlike (toggle).

Response:

```json
{
  "success": true,
  "message": "POST_LIKED",
  "data": { "liked": true, "totalLikes": 13 }
}
```

---

## Blog Owner – Quản lý bài viết của mình

> Yêu cầu: `Authorization: Bearer <token>` với tài khoản có role `BLOG_OWNER`.

### Danh sách bài của tôi

```http
GET /api/owner/posts
Authorization: Bearer <accessToken>
```

Query params:

```text
page    – mặc định 1
limit   – mặc định 10
status  – DRAFT | PENDING | PUBLISHED | REJECTED
search  – tìm trong tiêu đề
```

### Chi tiết bài của tôi

```http
GET /api/owner/posts/:id
Authorization: Bearer <accessToken>
```

### Tạo bài viết mới

```http
POST /api/owner/posts
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "thumbnail": "https://example.com/thumb.jpg",
  "categoryId": 1,
  "sourceLanguageId": 1,
  "translations": [
    {
      "languageId": 1,
      "title": "Tiêu đề bài viết",
      "content": "<p>Nội dung bài viết...</p>"
    },
    {
      "languageId": 2,
      "title": "Article Title",
      "content": "<p>Content...</p>"
    }
  ]
}
```

Bài tạo mới luôn có `status = DRAFT`.

Response:

```json
{
  "success": true,
  "message": "POST_CREATED",
  "data": { "id": "1", "status": "DRAFT", ... }
}
```

### Cập nhật bài viết

```http
PATCH /api/owner/posts/:id
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Chỉ cho phép khi bài ở trạng thái `DRAFT` hoặc `REJECTED`. Body giống Create, tất cả field đều optional.

Lỗi nếu sai trạng thái:

```json
{
  "success": false,
  "error": { "code": "POST_CANNOT_EDIT", "message": "Only DRAFT or REJECTED posts can be edited" }
}
```

### Xoá bài viết

```http
DELETE /api/owner/posts/:id
Authorization: Bearer <accessToken>
```

Soft delete – bài vẫn còn trong DB, chỉ gán `deleted_at`.

### Nộp bài chờ duyệt

```http
POST /api/owner/posts/:id/submit
Authorization: Bearer <accessToken>
```

Chuyển trạng thái `DRAFT` hoặc `REJECTED` → `PENDING`.

```json
{
  "success": true,
  "message": "POST_SUBMITTED",
  "data": { "id": "1", "status": "PENDING", "submittedAt": "..." }
}
```

Lỗi nếu bài đã pending:

```json
{
  "success": false,
  "error": { "code": "POST_ALREADY_SUBMITTED", "message": "Post is already waiting for approval" }
}
```

---

## Admin – Kiểm duyệt bài viết

> Yêu cầu: role `SUPER_ADMIN`.

### Danh sách tất cả bài viết

```http
GET /api/admin/posts
Authorization: Bearer <adminToken>
```

Query params:

```text
page        – mặc định 1
limit       – mặc định 10
status      – DRAFT | PENDING | PUBLISHED | REJECTED
authorId    – lọc theo tác giả
categoryId  – lọc theo danh mục
search      – tìm trong tiêu đề
```

### Chi tiết bài viết (admin)

```http
GET /api/admin/posts/:id
Authorization: Bearer <adminToken>
```

### Duyệt bài

```http
POST /api/admin/posts/:id/approve
Authorization: Bearer <adminToken>
```

Chỉ cho phép khi bài đang `PENDING`. Ghi audit log `POST_APPROVED`.

```json
{
  "success": true,
  "message": "POST_APPROVED",
  "data": { "id": "1", "status": "PUBLISHED", "publishedAt": "..." }
}
```

### Từ chối bài

```http
POST /api/admin/posts/:id/reject
Authorization: Bearer <adminToken>
Content-Type: application/json
```

```json
{
  "reason": "Nội dung không phù hợp với chính sách đăng tải."
}
```

Ghi audit log `POST_REJECTED`.

```json
{
  "success": true,
  "message": "POST_REJECTED",
  "data": { "id": "1", "status": "REJECTED", "rejectionReason": "..." }
}
```

---

## Admin – Dashboard

### Thống kê tổng quan

```http
GET /api/admin/dashboard
Authorization: Bearer <adminToken>
```

Response:

```json
{
  "success": true,
  "data": {
    "posts": {
      "draft": 5,
      "pending": 2,
      "published": 30,
      "rejected": 1,
      "total": 38
    },
    "interactions": {
      "comments": 120,
      "likes": 340
    },
    "users": {
      "total": 15
    },
    "topPosts": [...]
  }
}
```

---

## Upload ảnh

### Upload image

```http
POST /api/upload/image
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Field: `file` – file ảnh (jpg/jpeg/png/gif), tối đa 5MB.

Response:

```json
{
  "success": true,
  "message": "FILE_UPLOADED",
  "data": {
    "url": "/uploads/file-1234567890.jpg"
  }
}
```

Lỗi sai format:

```json
{
  "success": false,
  "error": { "code": "FILE_REQUIRED", "message": "File is required" }
}
```

> **Lưu ý**: URL trả về dùng để lưu vào DB (`thumbnail`, `avatar`, `coverImage`).
> Không lưu base64 vào DB.

---

## Luồng trạng thái bài viết

```
DRAFT ──submit──► PENDING ──approve──► PUBLISHED
                     │
                  reject
                     │
                     ▼
                  REJECTED ──submit──► PENDING (resubmit)
```

## Error codes phổ biến (Người 2)

| Code | HTTP | Ý nghĩa |
|------|------|---------|
| `POST_NOT_FOUND` | 404 | Không tìm thấy bài viết |
| `POST_CANNOT_EDIT` | 403 | Bài không ở trạng thái cho phép sửa |
| `POST_ALREADY_SUBMITTED` | 400 | Bài đang chờ duyệt |
| `POST_ALREADY_PUBLISHED` | 400 | Bài đã được đăng |
| `POST_NOT_PENDING` | 400 | Bài không ở trạng thái PENDING |
| `POST_NOT_PUBLISHED` | 400 | Không thể comment bài chưa đăng |
| `COMMENT_CREATED` | 201 | Tạo bình luận thành công |
| `PARENT_COMMENT_NOT_FOUND` | 404 | Không tìm thấy comment cha |
| `POST_LIKED` / `POST_UNLIKED` | 200 | Like / Unlike thành công |
| `FILE_REQUIRED` | 400 | Thiếu file upload |
