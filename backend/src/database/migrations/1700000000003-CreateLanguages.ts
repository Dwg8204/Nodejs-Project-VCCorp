import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLanguages1700000000003 implements MigrationInterface {
  name = 'CreateLanguages1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`languages\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`code\` VARCHAR(35) NOT NULL COMMENT 'Mã BCP 47, ví dụ vi, en, zh-Hans',
        \`name\` VARCHAR(255) NOT NULL,
        \`flag\` VARCHAR(2048) DEFAULT NULL COMMENT 'URL tài nguyên cờ',
        \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
        \`is_system_language\` TINYINT(1) NOT NULL DEFAULT 0,
        \`fallback_language_id\` INT UNSIGNED DEFAULT NULL,
        \`translation_status\` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_languages_code\` (\`code\`),
        KEY \`idx_languages_public\`
          (\`is_active\`, \`is_system_language\`, \`translation_status\`, \`deleted_at\`),
        KEY \`idx_languages_fallback\` (\`fallback_language_id\`),
        CONSTRAINT \`chk_languages_translation_status\`
          CHECK (\`translation_status\` IN ('DRAFT','TRANSLATING','READY','DISABLED')),
        CONSTRAINT \`fk_languages_fallback\`
          FOREIGN KEY (\`fallback_language_id\`) REFERENCES \`languages\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `languages`');
  }
}
