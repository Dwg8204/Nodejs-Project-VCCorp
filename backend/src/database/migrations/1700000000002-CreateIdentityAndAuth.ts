import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIdentityAndAuth1700000000002 implements MigrationInterface {
  name = 'CreateIdentityAndAuth1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`role\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`name_role\` VARCHAR(50) NOT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_role_name\` (\`name_role\`),
        CONSTRAINT \`chk_role_name\`
          CHECK (\`name_role\` IN ('SUPER_ADMIN','BLOG_OWNER','AUTHENTICATED_USER'))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`users\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_name\` VARCHAR(191) NOT NULL,
        \`email\` VARCHAR(191) NOT NULL,
        \`full_name\` VARCHAR(255) DEFAULT NULL,
        \`phone\` VARCHAR(20) DEFAULT NULL,
        \`avatar\` VARCHAR(2048) DEFAULT NULL COMMENT 'URL ảnh đại diện',
        \`cover_image\` VARCHAR(2048) DEFAULT NULL COMMENT 'URL ảnh bìa',
        \`date_of_birth\` DATE DEFAULT NULL,
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`email_verified\` TINYINT(1) NOT NULL DEFAULT 0,
        \`role_id\` INT UNSIGNED NOT NULL,
        \`otp_code_hash\` CHAR(64) DEFAULT NULL COMMENT 'SHA-256 của OTP kết hợp secret phía server',
        \`otp_purpose\` VARCHAR(30) DEFAULT NULL COMMENT 'PASSWORD_RESET hoặc EMAIL_VERIFICATION',
        \`otp_expires_at\` TIMESTAMP NULL DEFAULT NULL,
        \`otp_attempt_count\` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
        \`otp_last_sent_at\` TIMESTAMP NULL DEFAULT NULL,
        \`password_changed_at\` TIMESTAMP NULL DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_users_user_name\` (\`user_name\`),
        UNIQUE KEY \`uq_users_email\` (\`email\`),
        KEY \`idx_users_role_active\` (\`role_id\`, \`is_active\`),
        KEY \`idx_users_created_at\` (\`created_at\`),
        CONSTRAINT \`chk_users_otp_purpose\`
          CHECK (\`otp_purpose\` IS NULL OR \`otp_purpose\` IN ('PASSWORD_RESET','EMAIL_VERIFICATION')),
        CONSTRAINT \`fk_users_role\`
          FOREIGN KEY (\`role_id\`) REFERENCES \`role\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `users`');
    await queryRunner.query('DROP TABLE IF EXISTS `role`');
  }
}
