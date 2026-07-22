-- =============================================================================
-- VCCORP BLOG - MYSQL INITIAL SCHEMA
-- Đồng bộ với các nghiệp vụ hiện có trong docs/ và sẵn sàng cho NestJS/Angular.
-- LƯU Ý: Script này xóa toàn bộ bảng nghiệp vụ trước khi tạo lại.
-- =============================================================================

SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS `vccorp_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `vccorp_db`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `post_bookmarks`;
DROP TABLE IF EXISTS `post_likes`;
DROP TABLE IF EXISTS `comments`;
DROP TABLE IF EXISTS `post_translations`;
DROP TABLE IF EXISTS `posts`;
DROP TABLE IF EXISTS `category_translation`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `user_preferences`;
DROP TABLE IF EXISTS `system_settings`;
DROP TABLE IF EXISTS `languages`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `role`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. PHÂN QUYỀN VÀ NGƯỜI DÙNG
-- =============================================================================

CREATE TABLE `role` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name_role` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_role_name` (`name_role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  -- MEDIUMTEXT hỗ trợ cả URL lẫn data URL/base64 đang được giao diện HTML tạo ra.
  `avatar` MEDIUMTEXT DEFAULT NULL,
  `cover_image` MEDIUMTEXT DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `role_id` INT UNSIGNED NOT NULL,
  `otp_code` VARCHAR(10) DEFAULT NULL,
  `otp_created_at` TIMESTAMP NULL DEFAULT NULL,
  `otp_ttl_seconds` INT UNSIGNED NOT NULL DEFAULT 180,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_user_name` (`user_name`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `idx_users_role_active` (`role_id`, `is_active`),
  KEY `idx_users_created_at` (`created_at`),
  CONSTRAINT `fk_users_role`
    FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. NGÔN NGỮ, CÀI ĐẶT HỆ THỐNG VÀ TÙY CHỌN NGƯỜI DÙNG
-- =============================================================================

CREATE TABLE `languages` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(10) NOT NULL COMMENT 'Mã BCP 47 ngắn: vi, en, ja...',
  `name` VARCHAR(255) NOT NULL,
  `flag` VARCHAR(500) DEFAULT NULL COMMENT 'URL, emoji hoặc mã tài nguyên cờ',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_languages_code` (`code`),
  KEY `idx_languages_active_name` (`deleted_at`, `name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chỉ dùng một bản ghi id = 1 cho cài đặt toàn hệ thống.
CREATE TABLE `system_settings` (
  `id` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `default_language_id` INT UNSIGNED NOT NULL,
  `posts_per_page` SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  `require_post_approval` TINYINT(1) NOT NULL DEFAULT 1,
  `auto_translate_categories` TINYINT(1) NOT NULL DEFAULT 1,
  `auto_translate_posts` TINYINT(1) NOT NULL DEFAULT 1,
  `default_theme` VARCHAR(20) NOT NULL DEFAULT 'system',
  `reduce_motion` TINYINT(1) NOT NULL DEFAULT 0,
  `updated_by` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_system_settings_singleton` CHECK (`id` = 1),
  CONSTRAINT `chk_system_settings_page_size` CHECK (`posts_per_page` BETWEEN 1 AND 100),
  CONSTRAINT `chk_system_settings_theme` CHECK (`default_theme` IN ('system', 'light', 'dark')),
  CONSTRAINT `fk_settings_language`
    FOREIGN KEY (`default_language_id`) REFERENCES `languages` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_settings_updated_by`
    FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ghi đè lựa chọn riêng của mỗi tài khoản; NULL nghĩa là dùng mặc định hệ thống.
CREATE TABLE `user_preferences` (
  `user_id` INT UNSIGNED NOT NULL,
  `language_id` INT UNSIGNED DEFAULT NULL,
  `posts_per_page` SMALLINT UNSIGNED DEFAULT NULL,
  `theme` VARCHAR(20) DEFAULT NULL,
  `reduce_motion` TINYINT(1) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `chk_user_preferences_page_size`
    CHECK (`posts_per_page` IS NULL OR `posts_per_page` BETWEEN 1 AND 100),
  CONSTRAINT `chk_user_preferences_theme`
    CHECK (`theme` IS NULL OR `theme` IN ('system', 'light', 'dark')),
  CONSTRAINT `fk_preferences_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_preferences_language`
    FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. DANH MỤC ĐA NGÔN NGỮ
-- =============================================================================

CREATE TABLE `categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `source_language_id` INT UNSIGNED DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_categories_active_created` (`deleted_at`, `created_at`),
  CONSTRAINT `fk_categories_source_language`
    FOREIGN KEY (`source_language_id`) REFERENCES `languages` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `category_translation` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` INT UNSIGNED NOT NULL,
  `language_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `des` TEXT DEFAULT NULL,
  `is_auto_translated` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_category_translation_language` (`category_id`, `language_id`),
  KEY `idx_category_translation_language_name` (`language_id`, `name`),
  CONSTRAINT `fk_category_translation_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_category_translation_language`
    FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. BÀI VIẾT, DỊCH THUẬT VÀ QUY TRÌNH KIỂM DUYỆT
-- =============================================================================

CREATE TABLE `posts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `author_id` INT UNSIGNED NOT NULL,
  `category_id` INT UNSIGNED NOT NULL,
  `source_language_id` INT UNSIGNED DEFAULT NULL,
  -- Giao diện hiện tại đọc ảnh bằng FileReader nên có thể nhận data URL/base64 lớn.
  `thumbnail` MEDIUMTEXT NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `rejection_reason` TEXT DEFAULT NULL,
  `submitted_at` TIMESTAMP NULL DEFAULT NULL,
  `reviewed_by` INT UNSIGNED DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `published_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_posts_public_feed` (`status`, `deleted_at`, `published_at`),
  KEY `idx_posts_author_status_created` (`author_id`, `status`, `created_at`),
  KEY `idx_posts_category_status_published` (`category_id`, `status`, `published_at`),
  KEY `idx_posts_reviewer` (`reviewed_by`, `reviewed_at`),
  CONSTRAINT `chk_posts_status`
    CHECK (`status` IN ('DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED')),
  CONSTRAINT `fk_posts_author`
    FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_category`
    FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_source_language`
    FOREIGN KEY (`source_language_id`) REFERENCES `languages` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_posts_reviewer`
    FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `post_translations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT UNSIGNED NOT NULL,
  `language_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(500) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `is_auto_translated` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_translation_language` (`post_id`, `language_id`),
  KEY `idx_post_translation_language` (`language_id`, `post_id`),
  FULLTEXT KEY `ft_post_translation_title_content` (`title`, `content`),
  CONSTRAINT `fk_post_translation_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_post_translation_language`
    FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. TƯƠNG TÁC: BÌNH LUẬN, THÍCH VÀ LƯU BÀI
-- =============================================================================

CREATE TABLE `comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` INT UNSIGNED NOT NULL,
  `post_id` BIGINT UNSIGNED NOT NULL,
  `parent_id` BIGINT UNSIGNED DEFAULT NULL,
  `content` TEXT NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_comments_post_created` (`post_id`, `created_at`),
  KEY `idx_comments_user_created` (`user_id`, `created_at`),
  KEY `idx_comments_parent` (`parent_id`),
  CONSTRAINT `fk_comments_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comments_parent`
    FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `post_likes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `is_liked` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_likes_post_user` (`post_id`, `user_id`),
  KEY `idx_post_likes_user_updated` (`user_id`, `updated_at`),
  KEY `idx_post_likes_post_state` (`post_id`, `is_liked`),
  CONSTRAINT `fk_post_likes_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_post_likes_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `post_bookmarks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id` BIGINT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_post_bookmarks_post_user` (`post_id`, `user_id`),
  KEY `idx_post_bookmarks_user_created` (`user_id`, `created_at`),
  CONSTRAINT `fk_post_bookmarks_post`
    FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_post_bookmarks_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. NHẬT KÝ HOẠT ĐỘNG
-- =============================================================================

-- Append-only. entity_id không dùng foreign key để log vẫn tồn tại sau khi
-- đối tượng nguồn đã bị xóa. JSON metadata chỉ chứa dữ liệu bổ sung, không
-- thay thế các cột được dùng thường xuyên trong bộ lọc.
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actor_id` INT UNSIGNED DEFAULT NULL,
  `actor_name` VARCHAR(255) DEFAULT NULL,
  `actor_role` VARCHAR(50) DEFAULT NULL,
  `action` VARCHAR(80) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` BIGINT UNSIGNED DEFAULT NULL,
  `entity_label` VARCHAR(500) DEFAULT NULL,
  `before_data` JSON DEFAULT NULL,
  `after_data` JSON DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `created_at` TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_audit_created_id` (`created_at`, `id`),
  KEY `idx_audit_actor_created` (`actor_id`, `created_at`),
  KEY `idx_audit_action_created` (`action`, `created_at`),
  KEY `idx_audit_entity_created` (`entity_type`, `entity_id`, `created_at`),
  KEY `idx_audit_role_created` (`actor_role`, `created_at`),
  CONSTRAINT `fk_audit_actor`
    FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. DỮ LIỆU KHỞI TẠO
-- Mật khẩu của các tài khoản mẫu: 123456
-- =============================================================================

INSERT INTO `role` (`id`, `name_role`) VALUES
  (1, 'SUPER_ADMIN'),
  (2, 'BLOG_OWNER'),
  (3, 'AUTHENTICATED_USER');

INSERT INTO `users` (
  `id`, `user_name`, `email`, `full_name`, `phone`, `avatar`,
  `is_active`, `password_hash`, `email_verified`, `role_id`
) VALUES
  (1, 'admin', 'admin@blogproject.com', 'Super Admin Hệ Thống', '0123456789', NULL, 1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 1),
  (2, 'blogger1', 'blogger1@gmail.com', 'Nguyễn Văn Blogger Một', '0911111111', NULL, 1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 2),
  (3, 'blogger2', 'blogger2@gmail.com', 'Trần Thị Blogger Hai', '0922222222', NULL, 1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 2),
  (4, 'blogger3', 'blogger3@gmail.com', 'Lê Hoàng Blogger Ba', '0933333333', NULL, 1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 2),
  (5, 'blogger4', 'blogger4@gmail.com', 'Phạm Minh Blogger Bốn', '0944444444', NULL, 1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 2),
  (6, 'blogger5', 'blogger5@gmail.com', 'Hoàng Anh Blogger Năm', '0955555555', NULL, 1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 2),
  (7, 'reader1', 'reader1@gmail.com', 'Người Dùng Mẫu', NULL, NULL, 1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 3);

INSERT INTO `languages` (`id`, `code`, `name`, `flag`) VALUES
  (1, 'en', 'English', 'https://flagcdn.com/w40/gb.png'),
  (2, 'vi', 'Tiếng Việt', 'https://flagcdn.com/w40/vn.png');

INSERT INTO `system_settings` (
  `id`, `default_language_id`, `posts_per_page`, `require_post_approval`,
  `auto_translate_categories`, `auto_translate_posts`, `default_theme`,
  `reduce_motion`, `updated_by`
) VALUES (1, 2, 5, 1, 1, 1, 'system', 0, 1);

-- =============================================================================
-- 8. KIỂM TRA NHANH SAU KHI CHẠY SCRIPT
-- =============================================================================

SELECT 'schema_ready' AS `status`, DATABASE() AS `database_name`;
SELECT `id`, `name_role` FROM `role` ORDER BY `id`;
SELECT `id`, `code`, `name` FROM `languages` ORDER BY `id`;
SELECT * FROM `system_settings` WHERE `id` = 1;
