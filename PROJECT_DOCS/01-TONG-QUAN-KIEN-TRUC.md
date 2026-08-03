# 01. Tổng quan và kiến trúc

## 1. Mục tiêu hệ thống

VCCorp Blog là nền tảng xuất bản nội dung đa ngôn ngữ:

- Khách đọc danh sách và chi tiết bài đã xuất bản.
- Người dùng đăng ký, đăng nhập, thích, bình luận và quản lý hồ sơ.
- Blog Owner tạo bản nháp, thêm nhiều bản dịch và gửi bài chờ duyệt.
- Super Admin duyệt/từ chối/hủy duyệt bài; quản lý người dùng, danh mục, ngôn ngữ, nhật ký và dashboard.
- Hệ thống lưu lịch sử các hành động quản trị hoặc bảo mật quan trọng.

## 2. Công nghệ

| Lớp | Công nghệ | Vai trò |
|---|---|---|
| Frontend | Angular 18 standalone, TypeScript, RxJS Signals | UI responsive, routing, form, gọi API |
| Biểu đồ | Chart.js | Dashboard admin |
| Backend | NestJS 11 | REST API, guard, validation và nghiệp vụ |
| ORM | TypeORM 0.3 | Entity, query và migration |
| Database | MySQL/XAMPP | Dữ liệu bền vững |
| Auth | JWT trong HttpOnly cookie, bcrypt | Xác thực và bảo vệ mật khẩu |
| Cache | Redis qua ioredis, có memory fallback | Cache danh mục/ngôn ngữ |
| Media | Cloudinary | Lưu ảnh; database chỉ lưu URL |
| Email | Nodemailer + Gmail SMTP | Gửi OTP reset password |
| Realtime | Server-Sent Events (SSE) | Báo dashboard khi like/comment thay đổi |

## 3. Cấu trúc repository

```text
VCCorp_Project/
├── backend/
│   ├── src/
│   │   ├── common/              # enum, DTO dùng chung, utility
│   │   ├── config/              # kiểm tra biến môi trường
│   │   ├── database/            # TypeORM config, init.sql, migrations
│   │   └── modules/             # module nghiệp vụ NestJS
│   ├── API_DOCS.md              # tài liệu API cũ/tham khảo
│   └── package.json
├── frontend-angular/
│   ├── public/i18n/             # vi.json, en.json, zh.json
│   ├── scripts/                 # sinh/audit bản dịch
│   └── src/app/
│       ├── core/                # model, guard, interceptor, API service
│       ├── data/                # repository contract/implementation auth
│       ├── layout/              # public/admin/auth layout
│       ├── pages/               # page component theo route
│       └── shared/              # notification, pipe, pagination utility
├── docs/                        # giao diện HTML cũ để đối chiếu, không phải app chính
└── PROJECT_DOCS/                # bộ tài liệu hiện tại
```

## 4. Module backend

| Module | Trách nhiệm |
|---|---|
| `auth` | đăng ký, đăng nhập, cookie JWT, OTP, reset password, guard/role |
| `user` | entity `User`, `Role` và quan hệ |
| `profile` | hồ sơ cá nhân/công khai, đổi mật khẩu, ảnh đại diện/ảnh bìa |
| `post` | API public, owner, admin và workflow trạng thái bài |
| `category` | danh mục và bản dịch danh mục |
| `language` | danh sách ngôn ngữ public |
| `admin-languages` | CRUD, bật/tắt, xóa/khôi phục ngôn ngữ |
| `admin-users` | tạo/sửa/đổi role/khóa tài khoản |
| `interaction` | like, comment hai cấp, xóa comment, SSE event |
| `dashboard` | thống kê admin và SSE endpoint |
| `audit` | ghi log dùng chung |
| `admin-audit-logs` | tìm kiếm/lọc/xem log |
| `upload` | upload ảnh Cloudinary |
| `mail` | Gmail SMTP |
| `cache` | Redis + memory cache và invalidation |

Một module NestJS thường có:

```text
modules/post/
├── controllers/  # nhận HTTP, guard, lấy param/body/query
├── services/     # nghiệp vụ và TypeORM query
├── models/       # TypeORM entities
├── validations/  # DTO + class-validator
└── post.module.ts
```

## 5. Vai trò và quyền

| Khả năng | Khách | User | Blog Owner | Super Admin |
|---|:---:|:---:|:---:|:---:|
| Đọc bài published | ✓ | ✓ | ✓ | ✓ |
| Xem hồ sơ công khai | ✓ | ✓ | ✓ | ✓ |
| Like/comment |  | ✓ | ✓ | ✓ |
| Xóa comment của chính mình |  | ✓ | ✓ | ✓ |
| Sửa hồ sơ/đổi mật khẩu |  | ✓ | ✓ | ✓ |
| CRUD bài của chính mình |  |  | ✓ |  |
| Gửi bài chờ duyệt |  |  | ✓ |  |
| Duyệt/từ chối/hủy duyệt |  |  |  | ✓ |
| Quản lý users/categories/languages/logs |  |  |  | ✓ |

Backend là lớp quyết định quyền cuối cùng. Angular guard chỉ giúp điều hướng UX, không thay thế `JwtAuthGuard` và `RolesGuard`.

## 6. Vòng đời một HTTP request

Ví dụ Blog Owner gửi bài duyệt:

```text
PostFormComponent
  -> OwnerPostsApiService.submit(id)
  -> ApiClientService POST /api/owner/posts/:id/submit
       (withCredentials=true)
  -> JwtAuthGuard đọc JWT từ cookie
  -> RolesGuard kiểm tra BLOG_OWNER
  -> PostOwnerController.submit
  -> PostOwnerService kiểm tra chủ bài + trạng thái
  -> TypeORM cập nhật posts.status=PENDING
  -> AuditService ghi POST_SUBMITTED
  -> JSON response
  -> Angular cập nhật UI/notification
```

## 7. Quy ước quan trọng

- Toàn bộ backend có prefix `/api` từ `backend/src/main.ts`.
- API quản trị luôn nằm dưới `/api/admin/...`.
- Cookie auth yêu cầu frontend gửi `withCredentials: true` và backend CORS bật `credentials: true`.
- Backend `ValidationPipe` dùng `whitelist`, `forbidNonWhitelisted`, `transform`; gửi field thừa sẽ bị từ chối.
- Database dùng `utf8mb4` và timezone `+07:00`.
- `synchronize: false`; thay đổi schema phải tạo migration.
- Ảnh không lưu binary/local; chỉ URL Cloudinary được lưu vào MySQL.
- UI label nằm trong JSON frontend; bản dịch nội dung nằm trong database. Thêm một language record không tự sinh file JSON giao diện.
