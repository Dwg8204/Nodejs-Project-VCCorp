# Thiết lập HttpOnly cookie và Gmail SMTP

## 1. Gmail SMTP

Không sử dụng mật khẩu đăng nhập Gmail thông thường.

1. Đăng nhập tài khoản Google dùng để gửi mail.
2. Bật **Xác minh 2 bước** trong phần bảo mật tài khoản Google.
3. Mở **App passwords** và tạo mật khẩu ứng dụng mới, ví dụ `VCCorp Blog`.
4. Google cung cấp mật khẩu ứng dụng gồm 16 ký tự.
5. Điền vào `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-account@gmail.com
SMTP_APP_PASSWORD=your-16-character-app-password
SMTP_FROM=VCCorp Blog <your-account@gmail.com>
```

`SMTP_APP_PASSWORD` có thể nhập có hoặc không có khoảng trắng; backend sẽ tự loại
bỏ khoảng trắng. Không commit `.env` lên Git.

Nếu tài khoản Google không hiển thị **App passwords**, hãy kiểm tra:

- Xác minh 2 bước đã được bật.
- Tài khoản không bị quản trị viên Google Workspace chặn App passwords.
- Advanced Protection không được bật cho tài khoản đó.

## 2. Cookie khi chạy local

```env
CORS_ORIGIN=http://localhost:4200
AUTH_COOKIE_NAME=vccorp_access_token
AUTH_COOKIE_MAX_AGE_SECONDS=604800
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=lax
AUTH_COOKIE_DOMAIN=
```

`AUTH_COOKIE_MAX_AGE_SECONDS` nên bằng thời hạn `JWT_EXPIRES_IN`.

## 3. Cookie khi deploy frontend và backend khác domain

Ví dụ Angular nằm trên GitHub Pages và API nằm trên một domain HTTPS khác:

```env
CORS_ORIGIN=https://your-user.github.io
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_DOMAIN=
```

Backend production bắt buộc phải dùng HTTPS. Không đặt `AUTH_COOKIE_DOMAIN` thành
domain GitHub Pages; cookie phải thuộc domain API đã phát hành nó.

Angular đã sử dụng `withCredentials: true`. Backend cũng đã:

- Cho phép CORS credentials với origin chính xác.
- Kiểm tra `Origin` của request thay đổi dữ liệu để giảm nguy cơ CSRF.
- Đặt JWT trong cookie `HttpOnly`, do đó JavaScript không thể đọc JWT.

## 4. Kiểm tra

1. Khởi động MySQL/XAMPP.
2. Chạy backend và Angular.
3. Đăng nhập.
4. Mở DevTools → Application → Cookies → `http://localhost:3000`.
5. Kiểm tra cookie `vccorp_access_token` có cờ `HttpOnly`.
6. Kiểm tra `localStorage`: không còn `vccorp_access_token`.
7. Thử quên mật khẩu với email có trong database và kiểm tra hộp thư, cả thư mục Spam.
