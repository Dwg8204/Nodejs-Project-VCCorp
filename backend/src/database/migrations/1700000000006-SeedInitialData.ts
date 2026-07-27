import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedInitialData1700000000006 implements MigrationInterface {
  name = 'SeedInitialData1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO \`role\` (\`id\`, \`name_role\`) VALUES
        (1, 'SUPER_ADMIN'),
        (2, 'BLOG_OWNER'),
        (3, 'AUTHENTICATED_USER')
    `);

    // Mật khẩu của tài khoản mẫu là 123456 (bcrypt hash).
    await queryRunner.query(`
      INSERT INTO \`users\`
        (\`id\`, \`user_name\`, \`email\`, \`full_name\`, \`phone\`,
         \`is_active\`, \`password_hash\`, \`email_verified\`, \`role_id\`)
      VALUES
        (1, 'admin', 'admin@blogproject.com', 'Super Admin Hệ Thống', '0123456789',
         1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 1),
        (2, 'blogger1', 'blogger1@gmail.com', 'Nguyễn Văn Blogger Một', '0911111111',
         1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 2),
        (3, 'reader1', 'reader1@gmail.com', 'Người Dùng Mẫu', NULL,
         1, '$2b$10$9bpSGAJoauYqD3mkWJccEeXEf1Fn3oTD2f7Sc1ACnFhx4mdcUbQZ6', 1, 3)
    `);

    await queryRunner.query(`
      INSERT INTO \`languages\`
        (\`id\`, \`code\`, \`name\`, \`flag\`, \`is_active\`,
         \`is_system_language\`, \`fallback_language_id\`, \`translation_status\`)
      VALUES
        (1, 'en', 'English', 'https://flagcdn.com/gb.svg', 1, 1, NULL, 'READY'),
        (2, 'vi', 'Tiếng Việt', 'https://flagcdn.com/vn.svg', 1, 1, 1, 'READY'),
        (3, 'zh', 'Tiếng Trung', 'https://flagcdn.com/cn.svg', 1, 1, 1, 'READY')
    `);

    await queryRunner.query(`
      INSERT INTO \`categories\` (\`id\`, \`source_language_id\`) VALUES
        (1, 2), (2, 2), (3, 2), (4, 2), (5, 2)
    `);

    const categories: Array<[number, number, string, string]> = [
      [1,1,'UX Design','User experience and interface design'],
      [1,2,'Thiết kế UX','Trải nghiệm người dùng và thiết kế giao diện'],
      [1,3,'用户体验设计','用户体验和界面设计'],
      [2,1,'Programming','Software development'],
      [2,2,'Lập trình','Phát triển phần mềm'],
      [2,3,'编程','软件开发'],
      [3,1,'Society','Social topics'],
      [3,2,'Xã hội','Các chủ đề xã hội'],
      [3,3,'社会','社会话题'],
      [4,1,'News','Latest news'],
      [4,2,'Tin tức','Tin tức mới nhất'],
      [4,3,'新闻','最新新闻'],
      [5,1,'Economics','Economic topics'],
      [5,2,'Kinh tế','Các chủ đề kinh tế'],
      [5,3,'经济','经济话题'],
    ];
    let categoryTranslationId = 1;
    for (const [categoryId, languageId, name, description] of categories) {
      await queryRunner.query(
        `INSERT INTO \`category_translation\`
          (\`id\`, \`category_id\`, \`language_id\`, \`name\`, \`des\`,
           \`is_auto_translated\`)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [categoryTranslationId++, categoryId, languageId, name, description, languageId === 2 ? 0 : 1],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM `category_translation`');
    await queryRunner.query('DELETE FROM `categories`');
    await queryRunner.query('DELETE FROM `languages`');
    await queryRunner.query('DELETE FROM `users`');
    await queryRunner.query('DELETE FROM `role`');
  }
}
