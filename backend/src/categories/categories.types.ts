import type { RowDataPacket } from '../db/sqlite.js';

export interface CategoryDB extends RowDataPacket {
  id: number;
  name: string;
  productsCount?: number;
}
