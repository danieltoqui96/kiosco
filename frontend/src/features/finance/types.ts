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

export interface FinanceSummaryQuery {
  from?: string;
  to?: string;
}
