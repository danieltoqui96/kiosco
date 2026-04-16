import type { RowDataPacket } from 'mysql2';

export interface BrandDB extends RowDataPacket {
  id: number;
  name: string;
}
