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
  brand: string;
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

export interface SaleSummary {
  id: number;
  soldAt: string;
  itemsCount: number;
  totalSale: number;
  totalCost: number;
  profit: number;
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

export interface SalesQuery {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface UpdateSalePayload {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  soldAt?: string;
}

export type SalesProductsResult = PaginatedResult<SaleProduct>;
export type SalesResult = PaginatedResult<SaleSummary>;
