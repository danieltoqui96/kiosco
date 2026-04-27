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

  create(payload: { name: string }) {
    return requestJson<Brand>('/brands', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: { name: string }) {
    return requestJson<Brand>(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove(id: number) {
    return requestJson<Brand>(`/brands/${id}`, {
      method: 'DELETE',
    });
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

  create(payload: { name: string }) {
    return requestJson<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: number, payload: { name: string }) {
    return requestJson<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  remove(id: number) {
    return requestJson<Category>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
