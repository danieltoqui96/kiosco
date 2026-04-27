import { requestJson } from './http';
import type { Brand, CatalogQueryParams, Category, PaginatedResult } from '../types';

function toCatalogQuery(params: CatalogQueryParams = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page !== undefined) query.page = String(params.page);
  if (params.limit !== undefined) query.limit = String(params.limit);
  if (params.search !== undefined) query.search = params.search;
  return query;
}

export const brandsApi = {
  getAll(params?: CatalogQueryParams) {
    return requestJson<PaginatedResult<Brand>>('/brands', {
      query: toCatalogQuery(params),
    });
  },

  getById(id: number) {
    return requestJson<Brand>(`/brands/${id}`);
  },
};

export const categoriesApi = {
  getAll(params?: CatalogQueryParams) {
    return requestJson<PaginatedResult<Category>>('/categories', {
      query: toCatalogQuery(params),
    });
  },

  getById(id: number) {
    return requestJson<Category>(`/categories/${id}`);
  },
};
