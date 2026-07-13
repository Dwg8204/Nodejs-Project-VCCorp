# API Documentation for Postman

Tài liệu API chi tiết cho 2 module **Auth** và **User**. Copy trực tiếp JSON vào Postman để test.

> **Base URL**: `http://localhost:3000/api`

---

## 1. Auth Module (`/api/auth`)

### 1.1 Đăng ký tài khoản (Register)
- **URL**: `POST http://localhost:3000/api/auth/register`
- **Headers**: `Content-Type: application/json`
- **Body (JSON)**:
```json
{
  "userName": "testuser01",
  "fullName": "Nguyễn Văn Test",
  "email": "testuser01@gmail.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```
- **Response thành công (201)**:
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": 7,
      "userName": "testuser01",
      "fullName": "Nguyễn Văn Test",
      "email": "testuser01@gmail.com",
      "role": { "id": 3, "nameRole": "AUTHENTICATED_USER" }
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.2 Đăng nhập (Login)
- **URL**: `POST http://localhost:3000/api/auth/login`
- **Headers**: `Content-Type: application/json`
- **Body (JSON)** — Dùng tài khoản có sẵn trong init.sql (mật khẩu gốc: `123456`):

**Login Admin:**
```json
{
  "email": "admin@blogproject.com",
  "password": "123456"
}
```

**Login Blogger:**
```json
{
  "email": "blogger1@gmail.com",
  "password": "123456"
}
```

> [!IMPORTANT]
> Copy chuỗi `token` từ response → Trong Postman, tab **Authorization** → Type: **Bearer Token** → Dán token vào.

---

## 2. User Module (`/api/users`)

> Tất cả các API dưới đây đều yêu cầu Header:
> `Authorization: Bearer <TOKEN>`

### 2.1 Lấy thông tin cá nhân (Get Profile)
- **URL**: `GET http://localhost:3000/api/users/profile`
- **Headers**: `Authorization: Bearer <YOUR_TOKEN>`

### 2.2 Cập nhật thông tin cá nhân (Update Profile)
- **URL**: `PUT http://localhost:3000/api/users/profile`
- **Headers**: `Authorization: Bearer <YOUR_TOKEN>`, `Content-Type: application/json`
- **Body (JSON)** — Tất cả trường đều tùy chọn:
```json
{
  "fullName": "Nguyễn Văn A (Đã cập nhật)",
  "phone": "0912345678",
  "avatar": "https://example.com/avatar.jpg"
}
```

### 2.3 Lấy danh sách Users (Admin only)
- **URL**: `GET http://localhost:3000/api/users?page=1&limit=10&search=blogger`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Quyền yêu cầu**: `SUPER_ADMIN`
- **Query Parameters**:
  | Param  | Type   | Mô tả                          |
  |--------|--------|---------------------------------|
  | page   | number | Số trang (mặc định: 1)         |
  | limit  | number | Số bản ghi/trang (mặc định: 10)|
  | search | string | Tìm theo userName, fullName, email |

### 2.4 Lấy chi tiết User theo ID (Admin only)
- **URL**: `GET http://localhost:3000/api/users/:id`
- **Ví dụ**: `GET http://localhost:3000/api/users/2`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Quyền yêu cầu**: `SUPER_ADMIN`

### 2.5 Xóa User (Admin only)
- **URL**: `DELETE http://localhost:3000/api/users/:id`
- **Ví dụ**: `DELETE http://localhost:3000/api/users/7`
- **Headers**: `Authorization: Bearer <ADMIN_TOKEN>`
- **Quyền yêu cầu**: `SUPER_ADMIN`

---

## 3. Tài khoản có sẵn trong Database (init.sql)

| userName  | Email                    | Mật khẩu | Role              |
|-----------|--------------------------|-----------|-------------------|
| admin     | admin@blogproject.com    | 123456    | SUPER_ADMIN       |
| blogger1  | blogger1@gmail.com       | 123456    | BLOG_OWNER        |
| blogger2  | blogger2@gmail.com       | 123456    | BLOG_OWNER        |
| blogger3  | blogger3@gmail.com       | 123456    | BLOG_OWNER        |
| blogger4  | blogger4@gmail.com       | 123456    | BLOG_OWNER        |
| blogger5  | blogger5@gmail.com       | 123456    | BLOG_OWNER        |

> Mật khẩu đã được hash bằng bcrypt với giá trị gốc là `123456`.
