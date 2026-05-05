import { requestJson } from '../../products/api/http';
import type {
  CreateSalePayload,
  Sale,
  SalesQuery,
  SalesResult,
  SalesProductsQuery,
  SalesProductsResult,
  UpdateSalePayload,
} from '../types';

function toQuery(
  params: SalesProductsQuery & { from?: string; to?: string } = {},
): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page !== undefined) query.page = String(params.page);
  if (params.limit !== undefined) query.limit = String(params.limit);
  if (params.search !== undefined) query.search = params.search;
  if (params.from !== undefined) query.from = params.from;
  if (params.to !== undefined) query.to = params.to;
  return query;
}

export const salesApi = {
  getSales(params?: SalesQuery) {
    return requestJson<SalesResult>('/sales', {
      query: toQuery(params),
    });
  },

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

  updateSale(id: number, payload: UpdateSalePayload) {
    return requestJson<Sale>(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteSale(id: number) {
    return requestJson<{ id: number }>(`/sales/${id}`, {
      method: 'DELETE',
    });
  },
};
