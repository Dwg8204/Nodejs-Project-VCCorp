import { MigrationInterface, QueryRunner } from 'typeorm';

export class PreventDuplicateCategoryNames1700000000007
  implements MigrationInterface
{
  name = 'PreventDuplicateCategoryNames1700000000007';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`category_translation\`
      ADD UNIQUE KEY \`uq_category_translation_language_name\`
        (\`language_id\`, \`name\`)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`category_translation\`
      DROP INDEX \`uq_category_translation_language_name\`
    `);
  }
}
