export interface CashDaySummary {
  day: string;
  salesCount: number;
  itemsCount: number;
  initialCash: number;
  initialCard: number;
  salesCash: number;
  salesCard: number;
  depositsCash: number;
  depositsCard: number;
  withdrawalsCash: number;
  withdrawalsCard: number;
  currentCash: number;
  currentCard: number;
}

export interface CashDaySale {
  saleId: number;
  soldAt: string;
  totalItems: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'card';
}

export interface CashWithdrawal {
  id: number;
  movementType: 'in' | 'out';
  paymentMethod: 'cash' | 'card';
  amount: number;
  reason: 'purchase' | 'deposit' | 'change' | 'other';
  reference: string | null;
  note: string | null;
  createdAt: string;
  isVoided: boolean;
  voidedAt: string | null;
  voidedReason: string | null;
}

export interface CashDayDetail {
  summary: CashDaySummary;
  sales: CashDaySale[];
  withdrawals: CashWithdrawal[];
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CashSummaryResponse extends PaginatedResult<CashDaySummary> {
  totals: {
    cash: number;
    card: number;
  };
}

export interface CashQueryParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export interface UpdateCashInitialPayload {
  cash: number;
  card: number;
}

export interface CreateCashWithdrawalPayload {
  paymentMethod: 'cash' | 'card';
  amount: number;
  reason: 'purchase' | 'deposit' | 'change' | 'other';
  reference?: string;
  note?: string;
}

export interface CreateCashDepositPayload {
  paymentMethod: 'cash' | 'card';
  amount: number;
  reason: 'purchase' | 'deposit' | 'change' | 'other';
  reference?: string;
  note?: string;
}

export interface VoidCashWithdrawalPayload {
  reason: string;
}
