# 03. API reference

## 1. Quy ước chung

- Base local: `http://localhost:3000/api`.
- Body: JSON, trừ upload dùng `multipart/form-data` với field `file`.
- Cookie JWT: login/register trả `Set-Cookie`; browser phải gửi cookie ở request sau.
- Angular đã dùng `withCredentials: true` trong `ApiClientService`.
- Endpoint admin đều có prefix `/admin` và yêu cầu `SUPER_ADMIN`.
- Backend từ chối field không khai báo trong DTO.

Response thành công thường có dạng:

```json
{
  "success": true,
  "message": "POST_CREATED",
  "data": { "item": {} }
}
```

Response lỗi NestJS thường chứa code message có thể dịch ở Angular:

```json
{
  "message": "AUTH_INVALID_CREDENTIALS",
  "error": "Unauthorized",
  "statusCode": 401
}
```

Danh sách phân trang thường trả:

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
  }
}
```

## 2. Auth `/api/auth`

| Method | Path | Auth | Mục đích |
|---|---|---|---|
| POST | `/auth/register` | Public | đăng ký, tự đăng nhập bằng cookie |
| POST | `/auth/login` | Public | đăng nhập, set HttpOnly cookie |
| GET | `/auth/me` | JWT | lấy user phiên hiện tại |
| POST | `/auth/logout` | JWT | ghi log và clear cookie |
| POST | `/auth/forgot-password` | Public | gửi OTP Gmail nếu email hợp lệ |
| POST | `/auth/verify-otp` | Public | kiểm tra OTP, trả reset token 5 phút |
| POST | `/auth/reset-password` | Public | đổi mật khẩu bằng reset token |

Đăng ký:

```json
{
  "userName": "nguyenvana",
  "fullName": "Nguyễn Văn A",
  "email": "a@example.com",
  "password": "Password1",
  "confirmPassword": "Password1"
}
```

Mật khẩu dài 8–72, có chữ thường, chữ hoa và số. Đăng ký mặc định role `AUTHENTICATED_USER`.

Flow reset password bắt buộc ba bước:

```text
POST forgot-password {email}
POST verify-otp {email, otp: "123456"} -> resetToken
POST reset-password {resetToken, newPassword, confirmPassword}
```

Không dùng OTP sáu số trực tiếp làm `resetToken`.

## 3. Public content

### Posts

| Method | Path | Mục đích |
|---|---|---|
| GET | `/posts` | danh sách bài `PUBLISHED` |
| GET | `/posts/:id` | chi tiết bài `PUBLISHED` |

Query `/posts`: `page`, `limit`, `language`, `categoryId`, `search`, `authorId`, `sort=newest|oldest|popular`.

### Categories và languages

| Method | Path | Mục đích |
|---|---|---|
| GET | `/categories` | danh mục; hỗ trợ page/limit/language/search/sort |
| GET | `/languages` | ngôn ngữ system đang active/ready |

### Public profile

`GET /profiles/:id` trả thông tin hồ sơ công khai và dữ liệu cần cho trang profile.

## 4. Profile `/api/profile`

Tất cả yêu cầu JWT.

| Method | Path | Mục đích |
|---|---|---|
| GET | `/profile` | hồ sơ tài khoản hiện tại |
| PATCH | `/profile` | cập nhật `fullName`, `phone`, `dateOfBirth` |
| PATCH | `/profile/password` | đổi mật khẩu bằng mật khẩu hiện tại |
| POST | `/profile/images/avatar` | upload avatar Cloudinary |
| POST | `/profile/images/cover` | upload cover Cloudinary |

Đổi mật khẩu:

```json
{
  "currentPassword": "OldPassword1",
  "newPassword": "NewPassword1",
  "confirmPassword": "NewPassword1"
}
```

## 5. Like và comment

| Method | Path | Auth | Mục đích |
|---|---|---|---|
| GET | `/posts/:postId/likes/me` | JWT | trạng thái like của tôi |
| POST | `/posts/:postId/likes` | JWT | toggle like |
| GET | `/posts/:postId/comments` | Public | list comments, `page`, `limit` |
| POST | `/posts/:postId/comments` | JWT | tạo comment/reply |
| DELETE | `/posts/:postId/comments/:commentId` | JWT | xóa comment của chính mình |

Tạo comment gốc:

```json
{ "content": "Nội dung bình luận" }
```

Tạo reply:

```json
{ "content": "Nội dung trả lời", "parentId": "15" }
```

Service luôn quy reply về bình luận gốc để chỉ có hai tầng. Nếu trả lời người khác, backend thêm `@Tên`; nếu trả lời chính mình thì không tự tag. Xóa root sẽ xóa mềm root và các reply; xóa reply chỉ xóa reply đó.

## 6. Blog Owner `/api/owner/posts`

Yêu cầu JWT + role `BLOG_OWNER`.

| Method | Path | Mục đích |
|---|---|---|
| GET | `/owner/posts` | list bài của owner hiện tại |
| GET | `/owner/posts/:id` | chi tiết/preview bài thuộc owner |
| POST | `/owner/posts` | tạo draft |
| PATCH | `/owner/posts/:id` | cập nhật bài của owner |
| DELETE | `/owner/posts/:id` | xóa mềm bài |
| POST | `/owner/posts/:id/submit` | chuyển bài hợp lệ sang `PENDING` |

Query list: `page`, `limit`, `status`, `search`, `sort=newest|oldest|title-asc|title-desc`.

Payload tạo/cập nhật:

```json
{
  "thumbnail": "https://res.cloudinary.com/...",
  "categoryId": 2,
  "sourceLanguageId": 1,
  "translations": [
    {
      "languageId": 1,
      "title": "Tiêu đề",
      "content": "<p>Nội dung HTML đã làm sạch theo chính sách ứng dụng</p>",
      "isAutoTranslated": false
    },
    {
      "languageId": 2,
      "title": "Title",
      "content": "<p>Content</p>",
      "isAutoTranslated": true
    }
  ]
}
```

`thumbnail` bắt buộc khi tạo. Ảnh phải được upload trước rồi dùng URL trả về.

## 7. Admin posts `/api/admin/posts`

JWT + `SUPER_ADMIN`.

| Method | Path | Mục đích |
|---|---|---|
| GET | `/admin/posts` | list tất cả bài |
| GET | `/admin/posts/:id` | preview bài chưa published |
| POST | `/admin/posts/:id/approve` | `PENDING -> PUBLISHED` |
| POST | `/admin/posts/:id/reject` | `PENDING -> REJECTED` |
| POST | `/admin/posts/:id/unapprove` | `PUBLISHED -> PENDING` |

Reject body:

```json
{ "reason": "Nêu rõ lý do để tác giả chỉnh sửa" }
```

Query list: `page`, `limit`, `status`, `authorId`, `categoryId`, `search`, `sort`.

## 8. Admin categories `/api/admin/categories`

| Method | Path | Mục đích |
|---|---|---|
| GET | `/admin/categories` | list/search/sort/paginate |
| GET | `/admin/categories/:id` | chi tiết |
| POST | `/admin/categories` | tạo và lưu translations |
| PUT | `/admin/categories/:id` | cập nhật translations |
| DELETE | `/admin/categories/:id` | xóa mềm |
| PATCH | `/admin/categories/:id/restore` | khôi phục |

Payload:

```json
{
  "sourceLanguageId": 1,
  "translations": [
    { "languageId": 1, "name": "Công nghệ", "des": "...", "isAutoTranslated": false },
    { "languageId": 2, "name": "Technology", "des": "...", "isAutoTranslated": true }
  ]
}
```

## 9. Admin users `/api/admin/users`

| Method | Path | Mục đích |
|---|---|---|
| GET | `/admin/users` | list/filter users |
| GET | `/admin/users/:id` | chi tiết |
| POST | `/admin/users` | tạo user |
| PATCH | `/admin/users/:id` | sửa thông tin |
| PATCH | `/admin/users/:id/role` | đổi role |
| PATCH | `/admin/users/:id/lock` | khóa (`is_active=false`) |
| PATCH | `/admin/users/:id/unlock` | mở khóa |

Filter: `page`, `limit`, `search`, `role`, `status=ACTIVE|LOCKED`, `sort=newest|oldest|a-z|z-a`.

## 10. Admin languages `/api/admin/languages`

| Method | Path | Mục đích |
|---|---|---|
| GET | `/admin/languages` | list/filter, gồm bản ghi xóa nếu yêu cầu |
| GET | `/admin/languages/:id` | chi tiết |
| POST | `/admin/languages` | tạo language |
| PATCH | `/admin/languages/:id` | sửa code/name/flag/fallback |
| PATCH | `/admin/languages/:id/status` | đổi active + translation status |
| DELETE | `/admin/languages/:id` | soft delete |
| PATCH | `/admin/languages/:id/restore` | restore về trạng thái nghiệp vụ service quy định |

Filter: `page`, `limit`, `search`, `translationStatus`, `isActive`, `records=active|deleted|all`, `sort`.

Lưu ý: tạo language trong DB giúp nó xuất hiện trong danh sách ngôn ngữ nội dung. Để toàn bộ UI có bản dịch, phải có `public/i18n/<code>.json` đủ key hoặc bổ sung dịch động phía server trong tương lai.

## 11. Audit logs `/api/admin/logs`

| Method | Path | Mục đích |
|---|---|---|
| GET | `/admin/logs` | tìm kiếm/lọc/phân trang |
| GET | `/admin/logs/filter-options` | action/entity options cho dropdown |
| GET | `/admin/logs/:id` | metadata/before/after chi tiết |

Filter: `page`, `limit`, `search`, `actorId`, `action`, `entityType`, `entityId`, `fromDate`, `toDate`, `sort=newest|oldest`.

## 12. Dashboard và upload

- `GET /admin/dashboard?period=30`: stats, post status, engagement trend, top posts, content by category, translation coverage, recent activity.
- `GET /admin/dashboard/events`: SSE, event `LIKE_CHANGED`, `COMMENT_CREATED`, `COMMENT_DELETED`.
- `POST /uploads/images`: JWT, multipart field `file`, upload ảnh bài/nội dung lên Cloudinary.

SSE chỉ là tín hiệu “dữ liệu đã đổi”; Angular gọi lại dashboard API để lấy snapshot mới. Khi trang được mở/reload, dashboard cũng gọi API ngay nên không phụ thuộc event cũ.
