import type { RowDataPacket } from '../db/sqlite.js';

export interface SaleSummaryRowDB extends RowDataPacket {
  id: number;
  created_at: Date | string;
  payment_method: 'cash' | 'card';
  total_amount: number;
  total_items: number;
}

export interface SaleItemRowDB extends RowDataPacket {
  product_id: number;
  product_codebar: string;
  product_name: string;
  brand_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface SaleProductRowDB extends RowDataPacket {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  sale_price: number;
  stock: number;
  is_active: number;
}
