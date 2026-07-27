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
