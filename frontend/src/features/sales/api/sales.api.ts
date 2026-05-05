import { requestJson } from '../../products/api/http';
import type {
  CreateSalePayload,
  Sale,
  SalesProductsQuery,
  SalesProductsResult,
} from '../types';

function toQuery(params: SalesProductsQuery = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page !== undefined) query.page = String(params.page);
  if (params.limit !== undefined) query.limit = String(params.limit);
  if (params.search !== undefined) query.search = params.search;
  return query;
}

export const salesApi = {
  getProducts(params?: SalesProductsQuery) {
    return requestJson<SalesProductsResult>('/sales/products', {
      query: toQuery(params),
    });
  },

  createSale(payload: CreateSalePayload) {
    return requestJson<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getSaleById(id: number) {
    return requestJson<Sale>(`/sales/${id}`);
  },
};
