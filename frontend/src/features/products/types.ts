export interface ApiResponse<T> {
  success: boolean;
  data: T;
  msg: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Product {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  category: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  isActive: boolean;
}

export interface ProductFormValues {
  codebar: string;
  name: string;
  brand: string;
  category: string;
  salePrice: number;
  purchasePrice: number;
  stock: number;
  isActive: boolean;
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  brand?: string;
  category?: string;
  isActive?: boolean;
  minSalePrice?: number;
  maxSalePrice?: number;
  minStock?: number;
  maxStock?: number;
}

export interface ProductFiltersState {
  search: string;
  brand: string;
  category: string;
  isActive: '' | 'true' | 'false';
  minSalePrice: string;
  maxSalePrice: string;
  minStock: string;
  maxStock: string;
}

export interface ProductUiDerived {
  stockStatus: 'ok' | 'low' | 'zero';
  statusLabel: 'Active' | 'Inactive' | 'Low Stock' | 'Out of Stock';
}

export interface ProductSelectionState {
  selectedProductId: number | null;
  isDetailOpen: boolean;
}

export interface ProductModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  editingProductId: number | null;
}

// Fields kept only for visual parity with the original mock until API support exists.
export interface ProductMockExtras {
  sku?: string;
  provider?: string;
  model?: string;
  monthlySales?: number;
  minStock?: number;
  location?: string;
  lastEntryDate?: string;
  description?: string;
}

export type ProductViewModel = Product & ProductUiDerived & ProductMockExtras;
