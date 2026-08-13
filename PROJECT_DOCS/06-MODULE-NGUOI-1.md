# 06. Module do Người 1 phụ trách

Tài liệu này mô tả phần nền tảng, danh tính và quản trị hệ thống. Mã nguồn chính nằm trong
`auth`, `profile`, `admin-users`, `admin-languages`, `admin-audit-logs`, `audit`, `language`,
`mail`, `cache` và `user`.

## 1. Phạm vi module

| Module | Trách nhiệm |
|---|---|
| `user` | Entity `User`, `Role` và quan hệ dùng chung |
| `auth` | Đăng ký/nhập, JWT/cookie, refresh token, OTP, reset mật khẩu |
| `profile` | Hồ sơ riêng/công khai, đổi mật khẩu, avatar/ảnh bìa |
| `admin-users` | Tạo, sửa, đổi role, khóa/mở khóa user |
| `admin-languages` | Quản trị ngôn ngữ nội dung và trạng thái dịch |
| `language` | Danh sách ngôn ngữ public đã sẵn sàng |
| `audit`, `admin-audit-logs` | Ghi, lọc và xem log quản trị |
| `mail`, `cache` | SMTP OTP và Redis/memory cache dùng chung |

Mọi route admin đi qua `JwtAuthGuard`, `RolesGuard`, yêu cầu `SUPER_ADMIN`. ValidationPipe
toàn cục whitelist DTO và từ chối field không khai báo.

## 2. Auth và token

### Cookie và thời hạn

- Access JWT: 15 phút, HttpOnly cookie `vccorp_access_token`, path `/`.
- Refresh JWT: 7 ngày, HttpOnly cookie `vccorp_refresh_token`, path `/api/auth`.
- Database không lưu token gốc. `users` chỉ lưu SHA-256 `refresh_token_hash` và
  `refresh_token_expires_at`.
- Mỗi user chỉ có một refresh token hiện hành; đăng nhập mới ghi đè token cũ.
- Angular gặp `401` gọi `/api/auth/refresh`, nhận cookie mới rồi gửi lại request cũ.

```text
Login -> chuẩn hóa email -> bcrypt.compare -> kiểm tra is_active
      -> ký access + refresh -> lưu hash/expiry vào users
      -> set hai HttpOnly cookie -> trả safe user -> ghi audit
```

Refresh chạy transaction và khóa ghi hàng user. Token phải đúng chữ ký, đúng loại, chưa hết
hạn và hash phải trùng database. Mỗi lần refresh sẽ xoay token, làm token cũ mất hiệu lực.

Logout xóa hash nếu cookie khớp token hiện hành rồi clear cookie. Đổi/reset mật khẩu cập nhật
`password_changed_at` và xóa refresh token. Guard so sánh `password_changed_at` với `iat`, nên
access token cũ bị chặn ở request tiếp theo. Admin khóa user cũng xóa refresh token và guard
từ chối do `is_active=false`.

### Đăng ký và đăng nhập

- Username 2–50, fullname 2–255.
- Email hợp lệ, tối đa 191, chuẩn hóa lowercase.
- Password 8–72, có chữ thường, chữ hoa, số; confirm phải khớp.
- Email/username unique không phân biệt hoa thường.
- Role đăng ký mặc định `AUTHENTICATED_USER` phải tồn tại.
- Password được bcrypt hash; response không chứa hash, OTP hay JWT trong JSON.
- Login thất bại dùng message chung để không tiết lộ email có tồn tại.

### Quên/reset mật khẩu

```text
forgot-password
 -> luôn trả message chung
 -> kiểm tra cooldown
 -> sinh OTP 6 số bằng crypto.randomInt
 -> HMAC-SHA256 OTP với secret + user + purpose
 -> gửi Gmail SMTP rồi lưu hash/expiry/attempts

verify-otp
 -> kiểm tra format, hạn, số lần sai
 -> đúng thì cấp reset proof JWT 5 phút

reset-password
 -> verify proof và OTP hash còn hiệu lực
 -> bcrypt password mới, cập nhật password_changed_at
 -> xóa OTP và refresh token
```

Mặc định OTP sống 180 giây, tối đa 5 lần thử, cooldown 60 giây; tất cả cấu hình bằng env.

## 3. Profile

| API | Nghiệp vụ |
|---|---|
| `GET /api/profile` | Hồ sơ tài khoản hiện tại |
| `PATCH /api/profile` | Sửa fullname, phone, ngày sinh |
| `PATCH /api/profile/password` | Đổi mật khẩu |
| `POST /api/profile/images/:type` | Upload avatar/cover |
| `GET /api/profiles/:id` | Hồ sơ công khai |

- Fullname được trim, dài 2–255.
- Phone bắt đầu `0` hoặc `+84`, theo sau 9–10 chữ số.
- Ngày sinh là ISO date và phải nhỏ hơn hôm nay; hôm nay/tương lai bị từ chối.
- Đổi mật khẩu yêu cầu mật khẩu hiện tại đúng, mật khẩu mới khác cũ, đạt policy, confirm khớp.
- Profile không tự sửa role, email, trạng thái khóa hay password hash.
- Public profile loại email, phone và dữ liệu bảo mật.
- Ảnh JPEG/PNG/WebP, tối đa 5 MB, lưu Cloudinary; database chỉ lưu URL.

## 4. Admin quản lý user

API list/detail/create/update/change-role/lock/unlock nằm dưới `/api/admin/users`.

- List tối đa 100/page; tìm username/fullname/email; lọc role và active/locked; sort.
- Create/update kiểm tra unique username/email, định dạng phone, password và role tồn tại.
- Admin không tự khóa hoặc tự đổi role chính mình.
- Không được khóa/hạ role Super Admin cuối cùng.
- Khóa user xóa refresh token; access token tiếp tục bị guard chặn bởi `is_active`.
- Mọi thay đổi ghi before/after audit log.

## 5. Quản lý ngôn ngữ

Ngôn ngữ database dùng cho nội dung; JSON Angular dùng cho nhãn UI là lớp riêng. UI hiện
không cho thêm language mới, nhưng backend vẫn quản trị dữ liệu hiện hữu.

Trạng thái: `DRAFT`, `TRANSLATING`, `READY`, `DISABLED`.

- Code BCP-47 rút gọn, 2–35 ký tự, unique case-insensitive; name 2–255.
- Fallback phải tồn tại, active, chưa xóa; không tự tham chiếu hoặc tạo chu trình.
- Inactive chỉ đi với `DISABLED`; active không đi với `DISABLED`.
- Không xóa system language, language active cuối cùng hoặc language đang được dùng fallback.
- Soft delete đặt inactive + `DISABLED`; restore đặt inactive + `DRAFT` để admin kiểm tra trước.
- Thay đổi invalidate cache `languages:` và ghi audit.
- Public `/api/languages` chỉ trả active + `READY` + chưa xóa, cache 600 giây.

## 6. Audit log

`AuditService.record()` nhận actor, action, entity, before/after, metadata, IP, user-agent.
Khi nghiệp vụ có transaction, log dùng cùng `EntityManager`, nên cùng commit hoặc rollback.

Không log password, OTP, JWT, base64 hoặc toàn bộ content dài. Admin có thể tìm actor/entity,
lọc actor/action/entity/date, sort, phân trang và xem metadata/before/after. Khoảng ngày không
được ở tương lai, `from > to` hoặc vượt giới hạn service.

## 7. Cache và mail

Cache ưu tiên Redis; Redis lỗi thì dùng memory fallback để request không chết. Invalidate prefix
dùng Redis `SCAN`, không dùng `KEYS`. SMTP dùng Gmail App Password. Forgot-password gửi mail
trước khi lưu OTP để không tạo OTP mà user không nhận được.

## 8. Mã lỗi tiêu biểu

| Code | Ý nghĩa |
|---|---|
| `AUTH_INVALID_CREDENTIALS` | Sai thông tin đăng nhập |
| `AUTH_ACCOUNT_LOCKED` | Tài khoản bị khóa |
| `AUTH_TOKEN_REVOKED` | Token có trước lần đổi mật khẩu |
| `AUTH_REFRESH_TOKEN_INVALID_OR_EXPIRED` | Refresh sai, bị thay thế hoặc hết hạn |
| `ADMIN_LAST_SUPER_ADMIN_MUST_REMAIN` | Phải giữ Super Admin cuối cùng |
| `ADMIN_LANGUAGE_FALLBACK_CYCLE` | Fallback tạo vòng lặp |
| `ADMIN_LAST_ACTIVE_LANGUAGE_MUST_REMAIN` | Phải còn language active |
| `ADMIN_AUDIT_DATE_RANGE_INVALID` | Khoảng ngày log không hợp lệ |
