import type { RowDataPacket } from '../db/sqlite.js';

export interface CashDayRowDB extends RowDataPacket {
  day_date: string | Date;
  sales_count: number;
  items_count: number;
  initial_cash: number;
  initial_card: number;
  sales_cash: number;
  sales_card: number;
  deposits_cash: number;
  deposits_card: number;
  withdrawals_cash: number;
  withdrawals_card: number;
}

export interface CashSaleRowDB extends RowDataPacket {
  id: number;
  sold_at: string | Date;
  items_count: number;
  total_sale: number;
  payment_method: 'cash' | 'card' | null;
}

export interface CashWithdrawalRowDB extends RowDataPacket {
  id: number;
  movement_type: 'in' | 'out';
  payment_method: 'cash' | 'card';
  amount: number;
  note: string | null;
  reason: 'purchase' | 'deposit' | 'change' | 'other';
  reference: string | null;
  created_at: string | Date;
  voided_at: string | Date | null;
  voided_reason: string | null;
}
