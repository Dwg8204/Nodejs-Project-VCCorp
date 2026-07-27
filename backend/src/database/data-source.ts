import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource dành riêng cho TypeORM CLI.
 *
 * Database vccorp_db phải được tạo trước trong phpMyAdmin. Migration đầu tiên
 * sẽ xóa các bảng nghiệp vụ cũ (nếu có), sau đó các migration tiếp theo dựng
 * lại toàn bộ schema từ đầu.
 */
export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'vccorp_db',
  charset: 'utf8mb4',
  timezone: '+07:00',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true',
  migrationsTableName: 'typeorm_migrations',
  migrations: [`${__dirname}/migrations/*{.ts,.js}`],
});
