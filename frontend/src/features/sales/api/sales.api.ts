import { requestJson } from '../../products/api/http';
import type {
  CreateSalePayload,
  PaginatedResult,
  SaleDetail,
  SaleProduct,
  SaleQueryParams,
  SaleSummary,
} from '../types';

function toQuery(params: SaleQueryParams = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page !== undefined) query.page = String(params.page);
  if (params.limit !== undefined) query.limit = String(params.limit);
  if (params.q !== undefined) query.q = params.q;
  return query;
}

export const salesApi = {
  getAll(params?: SaleQueryParams) {
    return requestJson<PaginatedResult<SaleSummary>>('/sales', {
      query: toQuery(params),
    });
  },

  getById(id: number) {
    return requestJson<SaleDetail>(`/sales/${id}`);
  },

  create(payload: CreateSalePayload) {
    return requestJson<SaleDetail>('/sales', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProducts(params?: SaleQueryParams) {
    return requestJson<PaginatedResult<SaleProduct>>('/sales/products', {
      query: toQuery(params),
    });
  },
};
