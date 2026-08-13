# Tài liệu dự án VCCorp Blog

Tài liệu này là điểm bắt đầu cho lập trình viên mới tiếp nhận dự án. Nội dung mô tả **code đang tồn tại**, không mô tả bản HTML cũ trong `docs/` và không dựa trên mock data trước đây.

## Đọc theo thứ tự nào?

1. [01-TONG-QUAN-KIEN-TRUC.md](01-TONG-QUAN-KIEN-TRUC.md): mục tiêu, công nghệ, cấu trúc repository, vai trò và cách một request đi qua hệ thống.
2. [02-DATABASE.md](02-DATABASE.md): schema MySQL, quan hệ, migration, quy tắc dữ liệu và index.
3. [03-API-REFERENCE.md](03-API-REFERENCE.md): quy ước API, xác thực, phân quyền, endpoint, payload và response.
4. [04-FRONTEND-ANGULAR.md](04-FRONTEND-ANGULAR.md): route, layout, service, state, i18n, form, upload và cách nối UI với API.
5. [05-LUONG-NGHIEP-VU-VA-VAN-HANH.md](05-LUONG-NGHIEP-VU-VA-VAN-HANH.md): các flow end-to-end, chạy local, Redis, Cloudinary, SMTP, test và deploy.

6. [06-MODULE-NGUOI-1.md](06-MODULE-NGUOI-1.md): auth, profile, quản lý user/ngôn ngữ, audit, cache và mail.
7. [07-MODULE-NGUOI-2.md](07-MODULE-NGUOI-2.md): category, post workflow, interaction, dashboard và upload.

## Bản đồ nhanh

```text
Browser / Angular 18
        |
        | HTTP JSON + HttpOnly cookie; SSE cho dashboard
        v
NestJS 11 (/api)
        |
        +-- TypeORM --> MySQL (dữ liệu nghiệp vụ)
        +-- Redis ----> cache ngôn ngữ và danh mục
        +-- Cloudinary -> ảnh avatar/cover/thumbnail/nội dung
        +-- Gmail SMTP -> OTP đặt lại mật khẩu
```

## Thuật ngữ

- **Public user**: khách chưa đăng nhập.
- **Authenticated user**: tài khoản thường, role `AUTHENTICATED_USER`.
- **Blog Owner**: tác giả, role `BLOG_OWNER`.
- **Super Admin**: quản trị hệ thống, role `SUPER_ADMIN`.
- **System language**: ngôn ngữ có thể chọn trên giao diện và dùng để lấy bản dịch nội dung.
- **UI translation pack**: file JSON ở `frontend-angular/public/i18n/`, dùng dịch menu, nút, nhãn và thông báo giao diện.
- **Content translation**: bản dịch danh mục/bài viết, lưu trong MySQL.
- **Soft delete**: đặt `deleted_at`, không xóa vật lý dữ liệu.

## Nguồn sự thật

Khi tài liệu và code khác nhau, ưu tiên theo thứ tự:

1. Migration trong `backend/src/database/migrations/` cho schema.
2. DTO/controller/service backend cho hợp đồng API và nghiệp vụ.
3. Model/service/component Angular cho cách UI sử dụng API.
4. Tài liệu này.

Sau mỗi thay đổi API, schema hoặc flow lớn, người thực hiện phải cập nhật tài liệu tương ứng.
