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

## 3. Language Module (`/api/languages`) — Admin only

> Tất cả endpoint yêu cầu quyền `SUPER_ADMIN`.
> Headers: `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`

### 3.1 Tạo ngôn ngữ mới
- **URL**: `POST http://localhost:3000/api/languages`
- **Body**:
```json
{
  "code": "vi",
  "name": "Tiếng Việt",
  "flag": "🇻🇳"
}
```

### 3.2 Lấy danh sách ngôn ngữ
- **URL**: `GET http://localhost:3000/api/languages?page=1&limit=10&search=vi`
- **Query**: `page`, `limit`, `search`

### 3.3 Lấy ngôn ngữ theo ID
- **URL**: `GET http://localhost:3000/api/languages/1`

### 3.4 Cập nhật ngôn ngữ
- **URL**: `PUT http://localhost:3000/api/languages/1`
- **Body**:
```json
{
  "name": "Vietnamese",
  "flag": "🇻🇳"
}
```

### 3.5 Xóa mềm ngôn ngữ
- **URL**: `DELETE http://localhost:3000/api/languages/1`
- **Mô tả**: Gán `deleted_at = NOW()`, không xóa vật lý.

### 3.6 Khôi phục ngôn ngữ đã xóa
- **URL**: `PATCH http://localhost:3000/api/languages/1/restore`
- **Mô tả**: Gán `deleted_at = NULL`.

---

## 4. Category Module (`/api/categories`) — Admin only

> Tất cả endpoint yêu cầu quyền `SUPER_ADMIN`.
> Headers: `Authorization: Bearer <ADMIN_TOKEN>`, `Content-Type: application/json`

### 4.1 Tạo danh mục mới (kèm bản dịch đa ngôn ngữ)
- **URL**: `POST http://localhost:3000/api/categories`
- **Body**:
```json
{
  "translations": [
    {
      "languageId": 1,
      "name": "Công nghệ",
      "des": "Bài viết về công nghệ thông tin"
    },
    {
      "languageId": 2,
      "name": "Technology",
      "des": "Articles about information technology"
    }
  ]
}
```

### 4.2 Lấy danh sách danh mục
- **URL**: `GET http://localhost:3000/api/categories?page=1&limit=10&search=công nghệ`
- **Query**: `page`, `limit`, `search` (tìm theo tên bản dịch)

### 4.3 Lấy danh mục theo ID
- **URL**: `GET http://localhost:3000/api/categories/1`

### 4.4 Cập nhật danh mục (thay thế toàn bộ bản dịch)
- **URL**: `PUT http://localhost:3000/api/categories/1`
- **Body**:
```json
{
  "translations": [
    {
      "languageId": 1,
      "name": "Công nghệ (cập nhật)",
      "des": "Mô tả mới"
    },
    {
      "languageId": 2,
      "name": "Technology (updated)",
      "des": "New description"
    }
  ]
}
```

### 4.5 Xóa mềm danh mục
- **URL**: `DELETE http://localhost:3000/api/categories/1`
- **Mô tả**: Gán `deleted_at = NOW()`, không xóa vật lý.

### 4.6 Khôi phục danh mục đã xóa
- **URL**: `PATCH http://localhost:3000/api/categories/1/restore`
- **Mô tả**: Gán `deleted_at = NULL`.

---

## 5. Tài khoản có sẵn trong Database (init.sql)

| userName  | Email                    | Mật khẩu | Role              |
|-----------|--------------------------|-----------|-------------------|
| admin     | admin@gmail.com    | Duong2004    | SUPER_ADMIN       |

