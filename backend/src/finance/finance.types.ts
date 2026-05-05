import type { RowDataPacket } from 'mysql2';

export interface DailySummaryRow extends RowDataPacket {
  day: string;
  salesCount: number;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
}

export interface DailySaleRow extends RowDataPacket {
  id: number;
  sold_at: Date | string;
  items_count: number;
  total_sale: number;
  total_cost: number;
  profit: number;
}

export interface DailySaleItemRow extends RowDataPacket {
  id: number;
  sale_id: number;
  product_id: number;
  product_codebar: string;
  product_name: string;
  quantity: number;
  unit_sale_price: number;
  unit_purchase_price: number;
  line_sale_total: number;
  line_cost_total: number;
}

export interface FinanceDailySummary {
  day: string;
  salesCount: number;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
}

export interface FinanceDailySaleItem {
  id: number;
  saleId: number;
  productId: number;
  codebar: string;
  name: string;
  quantity: number;
  unitSalePrice: number;
  unitPurchasePrice: number;
  lineSaleTotal: number;
  lineCostTotal: number;
}

export interface FinanceDailySaleDetail {
  id: number;
  soldAt: string;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
  items: FinanceDailySaleItem[];
}

export interface FinanceDailyDetail {
  day: string;
  salesCount: number;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
  sales: FinanceDailySaleDetail[];
}
