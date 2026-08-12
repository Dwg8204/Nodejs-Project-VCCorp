# VCCorp database migrations

Các migration trong thư mục này là nguồn chính để khởi tạo cơ sở dữ liệu MySQL
`vccorp_db` cho backend NestJS.

## Cảnh báo trước khi chạy

Migration đầu tiên xóa toàn bộ các bảng nghiệp vụ cũ và dữ liệu bên trong chúng
trước khi tạo lại schema. Hãy export/backup cơ sở dữ liệu hiện tại trong
phpMyAdmin nếu còn dữ liệu cần giữ.

Không import `init.sql` rồi lại chạy bộ migration này trên cùng một database.
`init.sql` được giữ làm tài liệu schema/biện pháp khởi tạo thủ công; luồng được
khuyến nghị là chạy migration.

## Thứ tự migration

1. `ResetLegacySchema`: xóa các bảng nghiệp vụ cũ theo đúng thứ tự khóa ngoại.
2. `CreateIdentityAndAuth`: vai trò, người dùng và các trường OTP trong `users`.
3. `CreateLanguages`: danh sách ngôn ngữ nội dung động.
4. `CreateContentSchema`: danh mục, bài viết và các bản dịch nội dung.
5. `CreateInteractionsAndAudit`: bình luận, lượt thích và nhật ký hoạt động.
6. `SeedInitialData`: dữ liệu nền phục vụ frontend Angular và phát triển backend.
7. `PreventDuplicateCategoryNames`: ngăn tên danh mục trùng trong cùng ngôn ngữ.
8. `AddPostVersion`: thêm optimistic version cho quy trình kiểm duyệt bài viết.
9. `CreateUserSessions`: quản lý phiên đăng nhập và hash refresh token.

Schema nghiệp vụ sau khi chạy có 11 bảng:

1. `role`
2. `users`
3. `languages`
4. `categories`
5. `category_translation`
6. `posts`
7. `post_translations`
8. `comments`
9. `post_likes`
10. `audit_logs`
11. `user_sessions`

TypeORM tạo thêm `typeorm_migrations`. Đây là bảng kỹ thuật lưu lịch sử migration,
không phải bảng nghiệp vụ của ứng dụng.

## Chuẩn bị bằng XAMPP/phpMyAdmin

1. Mở XAMPP Control Panel và khởi động MySQL.
2. Mở `http://localhost/phpmyadmin`.
3. Export/backup `vccorp_db` nếu còn dữ liệu cần giữ.
4. Để chạy hoàn toàn từ đầu, chọn `vccorp_db` trong phpMyAdmin, mở tab
   **Operations** và chọn **Drop the database**.
5. Tạo lại database `vccorp_db` với collation `utf8mb4_unicode_ci`.
   Có thể thực hiện trong tab SQL:

```sql
DROP DATABASE IF EXISTS `vccorp_db`;
CREATE DATABASE `vccorp_db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Chỉ chạy lệnh `DROP DATABASE` sau khi chắc chắn không còn dữ liệu cần giữ.

6. Không import `init.sql`. Bộ migration sẽ tự tạo toàn bộ bảng.
7. Trong thư mục `backend`, tạo `.env` từ `.env.example` và kiểm tra:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=vccorp_db
DB_LOGGING=false
```

Nếu MySQL của XAMPP dùng cổng khác, sửa `DB_PORT` tương ứng.

## Chạy migration

Mở PowerShell tại thư mục `backend`:

```powershell
npm install
npm run migration:show
npm run migration:run
```

Sau khi hoàn tất, tải lại phpMyAdmin. Database phải có các bảng nghiệp vụ và bảng
`typeorm_migrations` dùng để theo dõi migration đã chạy.

Có thể xác minh nhanh trong phpMyAdmin:

```sql
USE `vccorp_db`;
SHOW TABLES;
SELECT * FROM `typeorm_migrations` ORDER BY `timestamp`;
```

## Hoàn tác

Hoàn tác một migration gần nhất:

```powershell
npm run migration:revert
```

Chạy lại lệnh nếu muốn lùi thêm một migration. Riêng `ResetLegacySchema` không
thể khôi phục dữ liệu/bảng cũ; đây là thao tác phá hủy có chủ đích nên backup là
bắt buộc nếu dữ liệu hiện tại còn giá trị.

Nếu đã từng chạy thử một bộ migration khác trên chính database này, hãy kiểm tra
bảng `typeorm_migrations` trước. Chỉ xóa bảng lịch sử đó khi thực sự muốn khởi
tạo lại hoàn toàn và đã backup dữ liệu.
