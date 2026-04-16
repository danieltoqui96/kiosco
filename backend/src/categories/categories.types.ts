import type { RowDataPacket } from 'mysql2';

export interface CategoryDB extends RowDataPacket {
  id: number;
  name: string;
}
