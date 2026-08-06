import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostVersion1700000000008 implements MigrationInterface {
  name = 'AddPostVersion1700000000008';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`posts\`
      ADD COLUMN \`version\` INT UNSIGNED NOT NULL DEFAULT 1 AFTER \`status\`
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`posts\`
      DROP COLUMN \`version\`
    `);
  }
}
