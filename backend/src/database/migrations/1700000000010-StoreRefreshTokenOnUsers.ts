import { MigrationInterface, QueryRunner } from 'typeorm';

export class StoreRefreshTokenOnUsers1700000000010 implements MigrationInterface {
  name = 'StoreRefreshTokenOnUsers1700000000010';

  async up(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.getTable('users');
    if (!users?.findColumnByName('refresh_token_hash')) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        ADD COLUMN \`refresh_token_hash\` CHAR(64) DEFAULT NULL AFTER \`password_changed_at\`,
        ADD COLUMN \`refresh_token_expires_at\` DATETIME(6) DEFAULT NULL AFTER \`refresh_token_hash\`
      `);
    }
    await queryRunner.query('DROP TABLE IF EXISTS `user_sessions`');
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const users = await queryRunner.getTable('users');
    if (users?.findColumnByName('refresh_token_hash')) {
      await queryRunner.query(`
        ALTER TABLE \`users\`
        DROP COLUMN \`refresh_token_expires_at\`,
        DROP COLUMN \`refresh_token_hash\`
      `);
    }
  }
}
