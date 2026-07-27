import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInteractionsAndAudit1700000000005 implements MigrationInterface {
  name = 'CreateInteractionsAndAudit1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE \`comments\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`post_id\` BIGINT UNSIGNED NOT NULL,
        \`parent_id\` BIGINT UNSIGNED DEFAULT NULL,
        \`content\` TEXT NOT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`deleted_at\` DATETIME(6) DEFAULT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`idx_comments_post_created\` (\`post_id\`, \`created_at\`),
        KEY \`idx_comments_user_created\` (\`user_id\`, \`created_at\`),
        KEY \`idx_comments_parent\` (\`parent_id\`),
        CONSTRAINT \`fk_comments_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`fk_comments_post\`
          FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_comments_parent\`
          FOREIGN KEY (\`parent_id\`) REFERENCES \`comments\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`post_likes\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`post_id\` BIGINT UNSIGNED NOT NULL,
        \`user_id\` INT UNSIGNED NOT NULL,
        \`is_liked\` TINYINT(1) NOT NULL DEFAULT 1,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`uq_post_likes_post_user\` (\`post_id\`, \`user_id\`),
        KEY \`idx_post_likes_user_updated\` (\`user_id\`, \`updated_at\`),
        KEY \`idx_post_likes_post_state\` (\`post_id\`, \`is_liked\`),
        CONSTRAINT \`fk_post_likes_post\`
          FOREIGN KEY (\`post_id\`) REFERENCES \`posts\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_post_likes_user\`
          FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await queryRunner.query(`
      CREATE TABLE \`audit_logs\` (
        \`id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`actor_id\` INT UNSIGNED DEFAULT NULL,
        \`actor_name\` VARCHAR(255) DEFAULT NULL,
        \`actor_role\` VARCHAR(50) DEFAULT NULL,
        \`action\` VARCHAR(80) NOT NULL,
        \`entity_type\` VARCHAR(50) NOT NULL,
        \`entity_id\` BIGINT UNSIGNED DEFAULT NULL,
        \`entity_label\` VARCHAR(500) DEFAULT NULL,
        \`before_data\` JSON DEFAULT NULL,
        \`after_data\` JSON DEFAULT NULL,
        \`metadata\` JSON DEFAULT NULL,
        \`ip_address\` VARCHAR(45) DEFAULT NULL,
        \`user_agent\` VARCHAR(500) DEFAULT NULL,
        \`created_at\` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`idx_audit_created_id\` (\`created_at\`, \`id\`),
        KEY \`idx_audit_actor_created\` (\`actor_id\`, \`created_at\`),
        KEY \`idx_audit_action_created\` (\`action\`, \`created_at\`),
        KEY \`idx_audit_entity_created\` (\`entity_type\`, \`entity_id\`, \`created_at\`),
        KEY \`idx_audit_role_created\` (\`actor_role\`, \`created_at\`),
        CONSTRAINT \`fk_audit_actor\`
          FOREIGN KEY (\`actor_id\`) REFERENCES \`users\` (\`id\`)
          ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `audit_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `post_likes`');
    await queryRunner.query('DROP TABLE IF EXISTS `comments`');
  }
}
