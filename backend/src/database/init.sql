-- =========================================================================
-- PHẦN 1: XÓA SẠCH TOÀN BỘ CÁC BẢNG CŨ (THEO THỨ TỰ AN TOÀN TRÁNH LỖI KHÓA NGOẠ)
-- =========================================================================
DROP TABLE IF EXISTS `post_likes`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `post_translations`;
DROP TABLE IF EXISTS `category_translation`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `languages`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `role`;


-- =========================================================================
-- PHẦN 2: KHỞI TẠO HỆ THỐNG BẢNG CHUẨN ĐỘNG (ĐÃ CÓ AVATAR & PHONE VÀ FIX LỖI)
-- =========================================================================

-- 1. Tạo bảng role (Danh sách vai trò hệ thống)
CREATE TABLE `role` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name_role` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Tạo bảng users (ĐÃ BỔ SUNG ĐẦY ĐỦ AVATAR VÀ PHONE)
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL COMMENT 'Số điện thoại của người dùng',
  `avatar` VARCHAR(500) DEFAULT NULL COMMENT 'Đường dẫn liên kết URL ảnh đại diện',
  `is_active` TINYINT(1) DEFAULT 1,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `email_verified` TINYINT(1) DEFAULT 0,
  `role_id` INT NOT NULL COMMENT 'Liên kết trực tiếp bằng ID dạng INT sang bảng role để dễ dàng mở rộng tác nhân',
  `otp_code` VARCHAR(10) DEFAULT NULL COMMENT 'Lưu mã PIN/OTP 6 số mới nhất',
  `otp_created_at` TIMESTAMP NULL COMMENT 'Thời điểm tạo mã OTP gần nhất',
  `otp_ttl_seconds` INT DEFAULT 180 COMMENT 'Thời gian sống của OTP tính bằng giây',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_name` (`user_name`),
  UNIQUE KEY `uq_email` (`email`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3. Tạo bảng languages
CREATE TABLE `languages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(5) NOT NULL COMMENT 'vi, en, ja...',
  `name` VARCHAR(255) NOT NULL,
  `flag` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_language_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4. Tạo bảng categories
CREATE TABLE `categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 5. Tạo bảng category_translation
CREATE TABLE `category_translation` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_id` INT NOT NULL,
  `language_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `des` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_cat_trans_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_cat_trans_language` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 6. Tạo bảng posts
CREATE TABLE `posts` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `author_id` INT NOT NULL,
  `category_id` INT NOT NULL,
  `status` VARCHAR(50) DEFAULT 'DRAFT',
  `source_language_id` INT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_posts_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_source_lang` FOREIGN KEY (`source_language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 7. Tạo bảng post_translations
CREATE TABLE `post_translations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `language_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `is_auto_translated` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_post_trans_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_post_trans_language` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FULLTEXT KEY `ft_title_content` (`title`, `content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 8. Tạo bảng comments
CREATE TABLE `comments` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `post_id` INT NOT NULL,
  `parent_id` INT DEFAULT NULL,
  `is_reply` TINYINT(1) DEFAULT 0,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_parent` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 9. Tạo bảng post_likes
CREATE TABLE `post_likes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `post_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `is_liked` TINYINT(1) DEFAULT 1,
  `updated_at` TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_user_like` (`post_id`, `user_id`),
  CONSTRAINT `fk_likes_post` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =========================================================================
-- PHẦN 3: CHÈN DỮ LIỆU BAN ĐẦU (ROLES, ADMIN VÀ 5 BLOGGERS MẬT KHẨU BCRYPT 123456)
-- =========================================================================

-- Khởi tạo các vai trò độc lập vào bảng role
INSERT INTO `role` (`id`, `name_role`) VALUES 
(1, 'SUPER_ADMIN'),
(2, 'BLOG_OWNER'),
(3, 'AUTHENTICATED_USER');

-- Khởi tạo tài khoản, bao gồm cả cột avatar và phone mặc định
INSERT INTO `users` (
  `user_name`, 
  `email`, 
  `full_name`, 
  `phone`,
  `avatar`,
  `is_active`, 
  `password_hash`, 
  `email_verified`, 
  `role_id`
) VALUES 
('admin', 'admin@blogproject.com', 'Super Admin Hệ Thống', '0123456789', 'https://example.com/avatars/admin.png', 1, '$2b$10$a6Mq7OoYEJn1/NJujrnleeD.HO6d2oxwccQ973GV2/x72BPrA3uc6', 1, 1),
('blogger1', 'blogger1@gmail.com', 'Nguyễn Văn Blogger Một', '0911111111', NULL, 1, '$2b$10$a6Mq7OoYEJn1/NJujrnleeD.HO6d2oxwccQ973GV2/x72BPrA3uc6', 1, 2),
('blogger2', 'blogger2@gmail.com', 'Trần Thị Blogger Hai',   '0922222222', NULL, 1, '$2b$10$a6Mq7OoYEJn1/NJujrnleeD.HO6d2oxwccQ973GV2/x72BPrA3uc6', 1, 2),
('blogger3', 'blogger3@gmail.com', 'Lê Hoàng Blogger Ba',    '0933333333', NULL, 1, '$2b$10$a6Mq7OoYEJn1/NJujrnleeD.HO6d2oxwccQ973GV2/x72BPrA3uc6', 1, 2),
('blogger4', 'blogger4@gmail.com', 'Phạm Minh Blogger Bốn',  '0944444444', NULL, 1, '$2b$10$a6Mq7OoYEJn1/NJujrnleeD.HO6d2oxwccQ973GV2/x72BPrA3uc6', 1, 2),
('blogger5', 'blogger5@gmail.com', 'Hoàng Anh Blogger Năm',  '0955555555', NULL, 1, '$2b$10$a6Mq7OoYEJn1/NJujrnleeD.HO6d2oxwccQ973GV2/x72BPrA3uc6', 1, 2);


-- 1. Bổ sung trường xóa mềm cho bảng Danh mục (categories)
ALTER TABLE `categories` 
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Lưu thời gian xóa mềm, NULL nghĩa là danh mục vẫn tồn tại';

-- 2. Bổ sung trường xóa mềm cho bảng Ngôn ngữ (languages)
ALTER TABLE `languages` 
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Lưu thời gian xóa mềm, NULL nghĩa là ngôn ngữ vẫn đang kích hoạt';

-- 3. Bổ sung trường xóa mềm cho bảng Bình luận (comments)
ALTER TABLE `comments` 
ADD COLUMN `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Lưu thời gian xóa mềm, khi hiển thị nếu không NULL sẽ hiện chữ: Bình luận này đã bị xóa';