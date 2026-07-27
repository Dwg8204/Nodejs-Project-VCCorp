import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetLegacySchema1700000000001 implements MigrationInterface {
  name = 'ResetLegacySchema1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'audit_logs',
      'post_bookmarks',
      'post_likes',
      'comments',
      'post_translations',
      'posts',
      'category_translation',
      'categories',
      'ui_translations',
      'ui_translation_keys',
      'user_preferences',
      'system_settings',
      'password_reset_tokens',
      'refresh_tokens',
      'languages',
      'users',
      'role',
    ];

    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
    await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  }

  public async down(): Promise<void> {
    // Migration này chỉ dọn schema cũ. Các migration tạo bảng phía sau chịu
    // trách nhiệm rollback từng bảng theo đúng thứ tự phụ thuộc.
  }
}
