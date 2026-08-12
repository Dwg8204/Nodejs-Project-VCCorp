# 05. Luồng nghiệp vụ và vận hành

## 1. Luồng đăng ký/đăng nhập

```text
Register/Login form
 -> POST /auth/register hoặc /auth/login
 -> validate DTO
 -> tìm/tạo user, bcrypt verify/hash
 -> kiểm tra isActive và role
 -> ký access JWT 15 phút và refresh JWT 7 ngày
 -> lưu hash và hạn refresh token trong users (một token/user)
 -> Set hai HttpOnly cookie
 -> audit log
 -> Angular giữ user trong memory signal
```

Cookie local thường dùng `secure=false`, `sameSite=lax`. Production HTTPS khác domain thường cần `secure=true`, `sameSite=none`, CORS origin chính xác và `credentials=true`.

## 2. Luồng quên mật khẩu

```text
Nhập email
 -> backend luôn trả message chung để tránh dò email
 -> nếu user hợp lệ: sinh OTP 6 số, HMAC hash, gửi Gmail
 -> lưu hash/purpose/expiry/attempts trong users

Nhập OTP
 -> giới hạn số lần và thời hạn
 -> nếu đúng: ký reset proof JWT 5 phút

Nhập mật khẩu mới
 -> verify reset proof + otp hash vẫn khớp và còn hạn
 -> bcrypt password mới
 -> clear toàn bộ OTP fields
 -> audit log
```

## 3. Luồng bài viết

```text
BLOG_OWNER tạo bài
  DRAFT
    | sửa/xóa được bởi chính owner
    v submit
  PENDING
    | approve                    | reject(reason)
    v                            v
  PUBLISHED                  REJECTED
    | unapprove                  | owner chỉnh sửa/gửi lại
    +-------------> PENDING <----+
```

Public API chỉ trả `PUBLISHED`. Preview owner/admin dùng endpoint riêng có guard; vì vậy bài pending không được “Read full article” bằng public link.

## 4. Luồng dịch

- Category/post có một `sourceLanguageId`.
- Mỗi bản dịch là một row riêng, đánh dấu `isAutoTranslated` nếu được máy dịch.
- Frontend gửi toàn bộ translations đã preview/lưu; backend không được giả vờ dịch bằng cách chép nguyên source rồi thêm `[EN]`.
- Language trong DB điều khiển lựa chọn nội dung.
- JSON frontend điều khiển chữ giao diện. Hiện chưa có dịch UI tự động từ backend khi admin tạo language mới.

## 5. Luồng tương tác

### Like

`POST /posts/:id/likes` toggle `post_likes.is_liked`, trả tổng like và publish `LIKE_CHANGED`.

### Comment

- Chỉ bài published mới cho comment.
- Reply vào reply vẫn trỏ về root để giữ hai tầng.
- Backend thêm mention khi reply người khác, bỏ self mention.
- Chỉ tác giả comment được xóa.
- Xóa root xóa mềm cả replies; trả `deletedCount` để UI trừ đúng count.
- Create/delete publish SSE event cho dashboard.

## 6. Audit logging

Những nhóm action đang/được thiết kế để ghi:

- Auth: register, login success/failure, logout, reset requested/verified/failure/success.
- Post: create, update, delete, submit, approve, reject, revoke approval.
- Category: create, update, delete, restore.
- Language: create, update, status, delete, restore.
- User: create, update, change role, lock, unlock.
- Profile/settings bảo mật: update profile, change password/image.

`metadata` bổ sung ngữ cảnh có cấu trúc; `before_data` và `after_data` hỗ trợ audit thay đổi. Không ghi password, token, OTP nguyên bản hoặc secret. Utility `sanitize-audit-data.util.ts` phải được dùng khi log payload nhạy cảm.

## 7. Cache Redis

Cache hiện dùng cho:

- `languages:available`, TTL 600 giây.
- danh sách category theo query, TTL 300 giây.

Khi Redis tắt hoặc mất kết nối, `AppCacheService` dùng memory cache trong process; app vẫn chạy nhưng cache không chia sẻ giữa instance.

Docker Desktop:

```powershell
docker run --name vccorp-redis -p 6379:6379 -d redis:7-alpine
docker exec -it vccorp-redis redis-cli
```

Trong Redis CLI:

```text
SCAN 0 MATCH vccorp:* COUNT 100
GET vccorp:languages:available
TTL vccorp:languages:available
```

Không thấy key trước khi API liên quan được gọi là bình thường. CRUD language/category gọi invalidation theo prefix.

## 8. Cloudinary và Gmail

### Cloudinary

- Backend nhận file in-memory qua Multer.
- Kiểm tra loại/kích thước theo `image-upload.options.ts`.
- Upload vào folder từ `CLOUDINARY_FOLDER`.
- MySQL chỉ lưu `secure_url`; không lưu local path.
- Xem `backend/CLOUDINARY_SETUP.md` để cấu hình chi tiết.

### Gmail SMTP

- Bật 2-Step Verification trên tài khoản Gmail.
- Tạo App Password; không dùng mật khẩu Gmail chính.
- Cấu hình `SMTP_HOST=smtp.gmail.com`, port/secure đồng bộ (465/true hoặc 587/false).
- Một số hosting miễn phí chặn SMTP; khi đó dùng email provider qua HTTPS API.
- Xem `backend/AUTH_COOKIE_GMAIL_SETUP.md`.

## 9. Biến môi trường backend

Tạo `backend/.env` từ `.env.example`. Nhóm bắt buộc:

```dotenv
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:4200

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=vccorp_db
DB_LOGGING=false

JWT_SECRET=<chuỗi ngẫu nhiên tối thiểu 32 ký tự>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<chuỗi ngẫu nhiên khác JWT_SECRET, tối thiểu 32 ký tự>
JWT_REFRESH_EXPIRES_IN=7d
AUTH_COOKIE_NAME=vccorp_access_token
AUTH_COOKIE_MAX_AGE_SECONDS=900
AUTH_REFRESH_COOKIE_NAME=vccorp_refresh_token
AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS=604800
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_DOMAIN=

SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=...
SMTP_APP_PASSWORD=...
SMTP_FROM=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=vccorp-blog

REDIS_ENABLED=true
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=vccorp:
```

Không để `JWT_SECRET` trống. Có thể tạo bằng PowerShell/.NET hoặc password manager; phải đủ entropy và khác nhau giữa các môi trường.

## 10. Chạy local từ đầu

Yêu cầu: Node.js 20+, npm, MySQL/XAMPP; Redis tùy chọn.

```powershell
# 1. MySQL/XAMPP: tạo vccorp_db utf8mb4_unicode_ci

# 2. Backend
cd backend
npm install
npm run migration:run
npm run dev

# 3. Frontend ở terminal khác
cd frontend-angular
npm install
npm start
```

Nếu gặp `EADDRINUSE :::3000`, một process khác đã dùng port 3000. Dừng backend cũ hoặc đổi `PORT`; khi đổi port phải sửa `environment.ts` frontend.

## 11. Checklist kiểm thử theo role

Unit test backend được chia theo module và đặt cạnh service/guard/config tương ứng. Chạy:

```powershell
cd backend
npm test
npm run test:watch
npm run test:cov
```

Các test dùng mock repository/service, không kết nối hoặc thay đổi MySQL, Redis, Gmail và Cloudinary thật. Unit test không thay thế checklist end-to-end theo role bên dưới.

### Guest

- Homepage/category/search/pagination đúng ngôn ngữ.
- Chỉ bài published mở được.
- Login/register/forgot-password hoạt động.
- Like/comment yêu cầu login.

### Authenticated User

- Session tồn tại sau reload nhờ cookie.
- Like toggle và count đúng.
- Comment/reply hai tầng, mention đúng, thu gọn reply.
- Chỉ xóa comment của mình; modal xác nhận đúng.
- Profile/avatar/cover/change password hoạt động.

### Blog Owner

- Sidebar có Manage Posts ở mọi page public/profile/article.
- List/filter/sort/pagination và mobile cards.
- Create/edit/upload/preview/translation.
- Submit tạo trạng thái pending, không published trực tiếp.
- Không đọc public bài pending.

### Super Admin

- Avatar/sidebar/profile đồng nhất.
- Dashboard dùng dữ liệu thật, chart đúng legend/date.
- Approve/reject/unapprove cập nhật ngay.
- CRUD/filter/pagination user/category/language.
- Audit filter/search/date/detail metadata/before/after.
- Mọi admin endpoint bị từ chối với role khác.

## 12. Build và deploy

Build kiểm tra:

```powershell
cd backend
npm run build

cd ../frontend-angular
npm run i18n:audit
npm run build
```

Production frontend dùng `apiBaseUrl: '/api'`, phù hợp khi cùng domain:

```text
https://example.com/       -> Angular static files
https://example.com/api/*  -> NestJS
```

Có hai cách:

1. Reverse proxy (Nginx/Caddy) phục vụ Angular và proxy `/api` vào NestJS.
2. NestJS phục vụ Angular build static và giữ `/api` cho controller.

GitHub Pages chỉ host frontend tĩnh, không chạy NestJS/MySQL/Redis. Nếu frontend ở GitHub Pages và backend domain khác, sửa `environment.production.ts`, CORS, cookie `SameSite=None; Secure` và kiểm tra hạn chế third-party cookie. Cùng domain/reverse proxy ổn định hơn.

## 13. Debug nhanh

| Hiện tượng | Kiểm tra |
|---|---|
| API 401 | cookie có được set/gửi; CORS credentials; token hết hạn |
| API 403 | role, `isActive`, origin middleware |
| API 400 | DTO/field thừa/enum/query param |
| Data DB đổi nhưng UI chưa đổi | response API, pagination/filter, cache invalidation |
| Redis không có key | `REDIS_ENABLED`, log connected, đã gọi endpoint cache chưa |
| Ảnh không hiện | URL Cloudinary, CORS, upload response, CSS max-width |
| UI lẫn ngôn ngữ | thiếu JSON key, runtime `choose`, content translation thiếu languageId |
| Trạng thái đổi sau reload nhưng UI đứng | kiểm tra error handler/notification và exception sau DB write |
| Dashboard chart cũ | API snapshot, ngày timezone, SSE cookie và event handler |

## 14. Definition of Done cho thay đổi mới

- Nghiệp vụ và quyền được kiểm tra ở backend.
- DTO validate và không nhận field thừa.
- Schema đổi bằng migration có `down()`.
- Audit log không chứa dữ liệu nhạy cảm.
- Cache có invalidation nếu dữ liệu nguồn thay đổi.
- Angular dùng API service, notification và loading chung.
- Bản dịch vi/en/zh đầy đủ; chạy audit i18n.
- Desktop/mobile và ba role được kiểm tra.
- Backend + frontend build thành công.
- Tài liệu liên quan được cập nhật.
