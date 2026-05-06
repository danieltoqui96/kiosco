export interface SaleSummary {
  id: number;
  createdAt: string;
  paymentMethod: 'cash' | 'card';
  totalAmount: number;
  totalItems: number;
}

export interface SaleItemDetail {
  productId: number;
  productCodebar: string;
  productName: string;
  brandName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDetail extends SaleSummary {
  items: SaleItemDetail[];
}

export interface SaleCreateItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSalePayload {
  items: SaleCreateItemInput[];
  paymentMethod: 'cash' | 'card';
  soldAt?: string;
}

export interface SaleProduct {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  salePrice: number;
  stock: number;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SaleQueryParams {
  page?: number;
  limit?: number;
  q?: string;
  paymentMethod?: '' | 'cash' | 'card';
  soldDate?: string;
}
