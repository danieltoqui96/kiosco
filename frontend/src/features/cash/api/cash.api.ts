import { requestJson } from '../../products/api/http';
import type {
  CashDayDetail,
  CashQueryParams,
  CashSummaryResponse,
  CreateCashDepositPayload,
  CreateCashWithdrawalPayload,
  UpdateCashInitialPayload,
  VoidCashWithdrawalPayload,
} from '../types';

function toQuery(params: CashQueryParams = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page !== undefined) query.page = String(params.page);
  if (params.limit !== undefined) query.limit = String(params.limit);
  if (params.from !== undefined) query.from = params.from;
  if (params.to !== undefined) query.to = params.to;
  return query;
}

export const cashApi = {
  getSummary(params?: CashQueryParams) {
    return requestJson<CashSummaryResponse>('/cash', {
      query: toQuery(params),
    });
  },

  getDayDetail(day: string) {
    return requestJson<CashDayDetail>(`/cash/day/${day}`);
  },

  updateInitial(day: string, payload: UpdateCashInitialPayload) {
    return requestJson<CashDayDetail>(`/cash/day/${day}/initial`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  createWithdrawal(day: string, payload: CreateCashWithdrawalPayload) {
    return requestJson<CashDayDetail>(`/cash/day/${day}/withdrawals`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createDeposit(day: string, payload: CreateCashDepositPayload) {
    return requestJson<CashDayDetail>(`/cash/day/${day}/deposits`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  voidWithdrawal(day: string, withdrawalId: number, payload: VoidCashWithdrawalPayload) {
    return requestJson<CashDayDetail>(`/cash/day/${day}/withdrawals/${withdrawalId}/void`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
