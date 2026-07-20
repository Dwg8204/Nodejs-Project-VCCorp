-- Chạy migration này với cơ sở dữ liệu MySQL đã tồn tại.
-- File ảnh nên được backend/object storage quản lý; cột này chỉ lưu URL công khai.
ALTER TABLE `posts`
  ADD COLUMN `thumbnail` VARCHAR(1000) NULL
  COMMENT 'URL ảnh đại diện bài viết'
  AFTER `category_id`;

-- Sau khi đã cập nhật URL cho các bản ghi cũ, có thể bắt buộc trường này:
-- ALTER TABLE `posts` MODIFY COLUMN `thumbnail` VARCHAR(1000) NOT NULL;
