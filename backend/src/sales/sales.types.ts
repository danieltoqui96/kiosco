import type { RowDataPacket } from 'mysql2';

export type PaymentMethod = 'cash' | 'card';

export interface SaleProductRow extends RowDataPacket {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  category: string;
  sale_price: number;
  purchase_price: number;
  stock: number;
  is_active: 0 | 1;
}

export interface SaleRow extends RowDataPacket {
  id: number;
  sold_at: Date | string;
  payment_method: PaymentMethod;
  items_count: number;
  total_sale: number;
  total_cost: number;
  profit: number;
}

export interface SaleItemRow extends RowDataPacket {
  id: number;
  sale_id: number;
  product_id: number;
  product_codebar: string;
  product_name: string;
  product_brand?: string | null;
  product_stock?: number | null;
  quantity: number;
  unit_sale_price: number;
  unit_purchase_price: number;
  line_sale_total: number;
  line_cost_total: number;
}

export interface SaleProduct {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  category: string;
  salePrice: number;
  stock: number;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  codebar: string;
  name: string;
  brand: string;
  stock: number;
  quantity: number;
  unitSalePrice: number;
  unitPurchasePrice: number;
  lineSaleTotal: number;
  lineCostTotal: number;
}

export interface Sale {
  id: number;
  soldAt: string;
  paymentMethod: PaymentMethod;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
  items: SaleItem[];
}

export interface SaleSummary {
  id: number;
  soldAt: string;
  paymentMethod: PaymentMethod;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
}

export interface CashboxRow extends RowDataPacket {
  id: number;
  cash_balance: number;
  card_balance: number;
  updated_at: Date | string;
}

export interface CashboxBalances {
  cash: number;
  card: number;
  total: number;
  updatedAt: string;
}
