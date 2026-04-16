import type { RowDataPacket } from 'mysql2';

export interface ProductDB extends RowDataPacket {
  id: number;
  codebar: string;
  name: string;
  brand_id: number;
  category_id: number;
  sale_price: number;
  purchase_price: number;
  stock: number;
  is_active: boolean;
}
