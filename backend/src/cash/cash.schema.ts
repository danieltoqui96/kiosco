import { z } from 'zod';
import type { PaginatedResult } from '../utils/pagination.utils.js';

export const paymentMethodSchema = z.enum(['cash', 'card']);
export const withdrawalReasonSchema = z.enum([
  'purchase',
  'deposit',
  'change',
  'other',
]);

export const updateCashInitialSchema = z.object({
  cash: z.number().int().min(0),
  card: z.number().int().min(0),
});

export const createCashWithdrawalSchema = z.object({
  paymentMethod: paymentMethodSchema,
  amount: z.number().int().positive(),
  reason: withdrawalReasonSchema,
  reference: z
    .string()
    .trim()
    .max(100)
    .optional(),
  note: z
    .string()
    .trim()
    .max(255)
    .optional(),
});

export const createCashDepositSchema = z.object({
  paymentMethod: paymentMethodSchema,
  amount: z.number().int().positive(),
  reason: withdrawalReasonSchema,
  reference: z
    .string()
    .trim()
    .max(100)
    .optional(),
  note: z
    .string()
    .trim()
    .max(255)
    .optional(),
});

export const voidCashWithdrawalSchema = z.object({
  reason: z.string().trim().min(3).max(255),
});

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
  paymentMethod: z.infer<typeof paymentMethodSchema>;
}

export interface CashWithdrawal {
  id: number;
  movementType: 'in' | 'out';
  paymentMethod: z.infer<typeof paymentMethodSchema>;
  amount: number;
  reason: z.infer<typeof withdrawalReasonSchema>;
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

export interface CashDayQuery {
  from?: string;
  to?: string;
}

export interface CashSummaryResponse extends PaginatedResult<CashDaySummary> {
  totals: {
    cash: number;
    card: number;
  };
}

export type UpdateCashInitialInput = z.infer<typeof updateCashInitialSchema>;
export type CreateCashWithdrawalInput = z.infer<typeof createCashWithdrawalSchema>;
export type CreateCashDepositInput = z.infer<typeof createCashDepositSchema>;
export type VoidCashWithdrawalInput = z.infer<typeof voidCashWithdrawalSchema>;
