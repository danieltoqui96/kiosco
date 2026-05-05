import { requestJson } from '../../products/api/http';
import type {
  FinanceDailyDetail,
  FinanceDailySummary,
  FinanceSummaryQuery,
} from '../types';

function toQuery(params: FinanceSummaryQuery = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.from !== undefined) query.from = params.from;
  if (params.to !== undefined) query.to = params.to;
  return query;
}

export const financeApi = {
  getDailySummary(params?: FinanceSummaryQuery) {
    return requestJson<FinanceDailySummary[]>('/finance/daily', {
      query: toQuery(params),
    });
  },

  getDailyDetail(day: string) {
    return requestJson<FinanceDailyDetail>(`/finance/daily/${day}`);
  },
};
