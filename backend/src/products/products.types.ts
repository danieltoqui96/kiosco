import type { RowDataPacket } from 'mysql2';

export interface ProductReadDB extends RowDataPacket {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  category: string;
  sale_price: number;
  purchase_price: number;
  stock: number;
  is_active: boolean;
}

export interface ProductWriteDB extends RowDataPacket {
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
