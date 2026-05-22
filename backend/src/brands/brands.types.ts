import type { RowDataPacket } from '../db/sqlite.js';

export interface BrandDB extends RowDataPacket {
  id: number;
  name: string;
  productsCount?: number;
}
