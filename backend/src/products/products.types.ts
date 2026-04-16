import type { RowDataPacket } from 'mysql2';

export interface ProductDB extends RowDataPacket {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  category: string;
  sale_price: number;
  purchase_price: number;
  stock: number;
  status: boolean;
}
