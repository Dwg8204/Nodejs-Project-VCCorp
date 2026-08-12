import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserSessions1700000000009 implements MigrationInterface {
  name = 'CreateUserSessions1700000000009';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`user_sessions\` (
        \`id\` CHAR(36) NOT NULL,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`refresh_token_hash\` CHAR(64) NOT NULL,
        \`expires_at\` DATETIME(6) NOT NULL,
        \`revoked_at\` DATETIME(6) DEFAULT NULL,
        \`last_used_at\` DATETIME(6) DEFAULT NULL,
        \`ip_address\` VARCHAR(45) DEFAULT NULL,
        \`user_agent\` VARCHAR(500) DEFAULT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
          ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_user_sessions_refresh_hash\` (\`refresh_token_hash\`),
        KEY \`idx_user_sessions_user_active\` (\`user_id\`, \`revoked_at\`, \`expires_at\`),
        KEY \`idx_user_sessions_expires_at\` (\`expires_at\`),
        CONSTRAINT \`fk_user_sessions_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `user_sessions`');
  }
}
