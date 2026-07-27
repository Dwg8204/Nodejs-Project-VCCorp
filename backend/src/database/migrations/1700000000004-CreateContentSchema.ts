import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContentSchema1700000000004 implements MigrationInterface {
  name = 'CreateContentSchema1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`categories\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`source_language_id\` INT UNSIGNED DEFAULT NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_categories_active_created\` (\`deleted_at\`, \`created_at\`),
        CONSTRAINT \`fk_categories_source_language\`
          FOREIGN KEY (\`source_language_id\`) REFERENCES \`languages\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`category_translation\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`category_id\` INT UNSIGNED NOT NULL,
        \`language_id\` INT UNSIGNED NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`des\` TEXT DEFAULT NULL,
        \`is_auto_translated\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_category_translation_language\` (\`category_id\`, \`language_id\`),
        KEY \`idx_category_translation_language_name\` (\`language_id\`, \`name\`),
        CONSTRAINT \`fk_category_translation_category\`
          FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_category_translation_language\`
          FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`posts\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`author_id\` INT UNSIGNED NOT NULL,
        \`category_id\` INT UNSIGNED NOT NULL,
        \`source_language_id\` INT UNSIGNED DEFAULT NULL,
        \`thumbnail\` VARCHAR(2048) NOT NULL COMMENT 'URL ảnh đại diện bài viết',
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        \`rejection_reason\` TEXT DEFAULT NULL,
        \`submitted_at\` DATETIME(6) DEFAULT NULL,
        \`reviewed_by\` INT UNSIGNED DEFAULT NULL,
        \`reviewed_at\` DATETIME(6) DEFAULT NULL,
        \`published_at\` DATETIME(6) DEFAULT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` DATETIME(6) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_posts_public_feed\` (\`status\`, \`deleted_at\`, \`published_at\`),
        KEY \`idx_posts_author_status_created\` (\`author_id\`, \`status\`, \`created_at\`),
        KEY \`idx_posts_category_status_published\` (\`category_id\`, \`status\`, \`published_at\`),
        KEY \`idx_posts_reviewer\` (\`reviewed_by\`, \`reviewed_at\`),
        CONSTRAINT \`chk_posts_status\`
          CHECK (\`status\` IN ('DRAFT','PENDING','PUBLISHED','REJECTED')),
        CONSTRAINT \`fk_posts_author\`
          FOREIGN KEY (\`author_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_posts_category\`
          FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_posts_source_language\`
          FOREIGN KEY (\`source_language_id\`) REFERENCES \`languages\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`fk_posts_reviewer\`
          FOREIGN KEY (\`reviewed_by\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`post_translations\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`post_id\` BIGINT UNSIGNED NOT NULL,
        \`language_id\` INT UNSIGNED NOT NULL,
        \`title\` VARCHAR(500) NOT NULL,
        \`content\` LONGTEXT NOT NULL,
        \`is_auto_translated\` TINYINT(1) NOT NULL DEFAULT 0,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_post_translation_language\` (\`post_id\`, \`language_id\`),
        KEY \`idx_post_translation_language\` (\`language_id\`, \`post_id\`),
        FULLTEXT KEY \`ft_post_translation_title_content\` (\`title\`, \`content\`),
        CONSTRAINT \`fk_post_translation_post\`
          FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_post_translation_language\`
          FOREIGN KEY (\`language_id\`) REFERENCES \`languages\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `post_translations`');
    await queryRunner.query('DROP TABLE IF EXISTS `posts`');
    await queryRunner.query('DROP TABLE IF EXISTS `category_translation`');
    await queryRunner.query('DROP TABLE IF EXISTS `categories`');
  }
}
