import { createPool } from 'mysql2/promise.js';
import 'dotenv/config';

export const pool = createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || '',
  port: Number(process.env.MYSQL_PORT) || 3306,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'kiosco',
});
