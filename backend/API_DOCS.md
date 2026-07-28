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

## Profile

```http
GET /api/profile
Authorization: Bearer <accessToken>
```

```http
PATCH /api/profile
Authorization: Bearer <accessToken>
Content-Type: application/json
```

```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0912345678",
  "dateOfBirth": "2000-08-02",
  "avatar": "https://example.com/avatar.jpg",
  "coverImage": "https://example.com/cover.jpg"
}
```

Tất cả trường đều tùy chọn. Để xóa giá trị có thể truyền `null`.

## Admin users

Tất cả endpoint yêu cầu:

```http
Authorization: Bearer <SUPER_ADMIN accessToken>
```

### Danh sách

```http
GET /api/admin/users?page=1&limit=10&search=&role=BLOG_OWNER&status=ACTIVE&sort=newest
```

Giá trị sort:

```text
newest
oldest
a-z
z-a
```

### Chi tiết

```http
GET /api/admin/users/:id
```

### Tạo tài khoản

```http
POST /api/admin/users
```

```json
{
  "userName": "blogger02",
  "email": "blogger02@example.com",
  "fullName": "Blog Owner 02",
  "phone": "0912345678",
  "password": "Password123",
  "role": "BLOG_OWNER"
}
```

### Cập nhật thông tin

```http
PATCH /api/admin/users/:id
```

```json
{
  "fullName": "Tên mới",
  "phone": "0987654321"
}
```

### Đổi role

```http
PATCH /api/admin/users/:id/role
```

```json
{
  "role": "BLOG_OWNER"
}
```

### Khóa và mở khóa

```http
PATCH /api/admin/users/:id/lock
PATCH /api/admin/users/:id/unlock
```

Admin không thể tự khóa hoặc tự đổi role. Hệ thống không cho khóa/hạ quyền Super
Admin cuối cùng.

## Admin audit logs

Các API bên dưới chỉ cho phép `SUPER_ADMIN` truy cập và chỉ có quyền đọc.

### Danh sách và tìm kiếm

```http
GET /api/admin/logs?page=1&limit=20&search=&actorId=&action=&entityType=&entityId=&fromDate=2026-07-01&toDate=2026-07-28&sort=newest
```

Các bộ lọc:

- `search`: tìm trong tên người thực hiện, nhãn đối tượng, action và loại đối tượng.
- `actorId`: ID người thực hiện.
- `action`: mã action chính xác, ví dụ `AUTH_LOGIN_SUCCEEDED`.
- `entityType`: loại đối tượng chính xác, ví dụ `USER`, `POST`, `CATEGORY`.
- `entityId`: ID đối tượng.
- `fromDate`, `toDate`: ngày dạng `YYYY-MM-DD` hoặc ISO 8601. Ngày kết thúc được tính trọn ngày theo múi giờ `+07:00`.
- `sort`: `newest` hoặc `oldest`.

Khoảng ngày tối đa cho một truy vấn là 365 ngày. API danh sách không trả về `beforeData`,
`afterData`, `metadata` và `userAgent` để giảm dữ liệu đọc từ MySQL và dữ liệu truyền về frontend.

### Dữ liệu cho các dropdown bộ lọc

```http
GET /api/admin/logs/filter-options
```

Kết quả gồm các `actions`, `entityTypes` và `actors` thực sự đang có trong bảng `audit_logs`.

### Chi tiết một log

```http
GET /api/admin/logs/:id
```

API chi tiết trả thêm `beforeData`, `afterData`, `metadata` và `userAgent`. Các trường nhạy cảm
như mật khẩu, OTP, token, cookie, authorization và secret luôn được thay bằng `[REDACTED]`
trước khi gửi về frontend.

## Admin languages

Tất cả endpoint yêu cầu access token của `SUPER_ADMIN`.

### Danh sách

```http
GET /api/admin/languages?page=1&limit=10&search=&translationStatus=READY&isActive=true&records=active&sort=newest
```

`records` nhận:

```text
active
deleted
all
```

### Chi tiết

```http
GET /api/admin/languages/:id
```

### Tạo ngôn ngữ

```http
POST /api/admin/languages
```

```json
{
  "code": "ja",
  "name": "日本語",
  "flag": "https://flagcdn.com/jp.svg",
  "fallbackLanguageId": 1,
  "isActive": true,
  "translationStatus": "DRAFT"
}
```

### Cập nhật thông tin/fallback

```http
PATCH /api/admin/languages/:id
```

```json
{
  "name": "日本語",
  "fallbackLanguageId": 1
}
```

Truyền `fallbackLanguageId: null` để bỏ fallback.

### Đổi trạng thái

```http
PATCH /api/admin/languages/:id/status
```

Ngôn ngữ hoạt động không được có trạng thái `DISABLED`:

```json
{
  "isActive": true,
  "translationStatus": "READY"
}
```

Ngôn ngữ không hoạt động phải có trạng thái `DISABLED`:

```json
{
  "isActive": false,
  "translationStatus": "DISABLED"
}
```

### Xóa mềm và khôi phục

```http
DELETE /api/admin/languages/:id
PATCH  /api/admin/languages/:id/restore
```

Ngôn ngữ hệ thống (`isSystemLanguage=true`) không được xóa. Ngôn ngữ đang được
dùng làm fallback hoặc là ngôn ngữ hoạt động cuối cùng không được vô hiệu hóa.
Ngôn ngữ khôi phục trở lại ở trạng thái `DRAFT` và chưa active.
