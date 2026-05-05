import type { PaginatedResult } from '../products/types';

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
  quantity: number;
  unitSalePrice: number;
  unitPurchasePrice: number;
  lineSaleTotal: number;
  lineCostTotal: number;
}

export interface Sale {
  id: number;
  soldAt: string;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
  items: SaleItem[];
}

export interface CreateSalePayload {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface SalesProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export type SalesProductsResult = PaginatedResult<SaleProduct>;
