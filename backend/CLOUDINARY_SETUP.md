# Cấu hình Cloudinary

Backend sử dụng Cloudinary cho toàn bộ ảnh do người dùng tải lên. MySQL chỉ lưu
`secure_url`; không lưu file local và không lưu chuỗi base64.

## 1. Lấy thông tin Cloudinary

1. Tạo hoặc đăng nhập tài khoản tại Cloudinary.
2. Mở Dashboard và lấy `Cloud name`, `API key`, `API secret`.
3. Không đưa `API secret` vào Angular và không commit file `.env`.

## 2. Khai báo backend/.env

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=vccorp-blog
```

Khởi động lại backend sau khi thay đổi `.env`.

## 3. Quy tắc upload

- Chấp nhận JPEG, PNG và WebP.
- Kích thước tối đa 5 MB.
- Backend chuyển ảnh sang WebP và tối ưu chất lượng tự động.
- Avatar và ảnh bìa dùng đường dẫn cố định theo user, upload mới sẽ ghi đè ảnh
  cũ để hạn chế file rác.
- Ảnh bài viết được lưu trong thư mục theo user và nhận URL HTTPS từ Cloudinary.

## 4. API

Các request cần cookie đăng nhập và dùng `multipart/form-data`, tên field là
`file`.

```text
POST /api/profile/images/avatar
POST /api/profile/images/cover
POST /api/uploads/images
```

Nếu thiếu cấu hình, API trả `UPLOAD_CLOUDINARY_NOT_CONFIGURED`. Nếu upload thất
bại, API trả `UPLOAD_CLOUDINARY_FAILED`.
