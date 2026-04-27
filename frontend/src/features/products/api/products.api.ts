import { requestJson } from './http';
import type { PaginatedResult, Product, ProductFormValues, ProductQueryParams } from '../types';

function toProductQuery(params: ProductQueryParams = {}): Record<string, string> {
  const query: Record<string, string> = {};

  if (params.page !== undefined) query.page = String(params.page);
  if (params.limit !== undefined) query.limit = String(params.limit);
  if (params.search !== undefined) query.search = params.search;
  if (params.brand !== undefined) query.brand = params.brand;
  if (params.category !== undefined) query.category = params.category;
  if (params.isActive !== undefined) query.isActive = String(params.isActive);
  if (params.minSalePrice !== undefined) query.minSalePrice = String(params.minSalePrice);
  if (params.maxSalePrice !== undefined) query.maxSalePrice = String(params.maxSalePrice);
  if (params.minStock !== undefined) query.minStock = String(params.minStock);
  if (params.maxStock !== undefined) query.maxStock = String(params.maxStock);

  return query;
}

export const productsApi = {
  getAll(params?: ProductQueryParams) {
    return requestJson<PaginatedResult<Product>>('/products', {
      query: toProductQuery(params),
    });
  },

  getById(id: number) {
    return requestJson<Product>(`/products/${id}`);
  },

  getByCodebar(codebar: string) {
    return requestJson<Product>(`/products/codebar/${encodeURIComponent(codebar)}`);
  },

  create(payload: ProductFormValues) {
    return requestJson<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: Partial<ProductFormValues>) {
    return requestJson<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove(id: number) {
    return requestJson<Product>(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};
