import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { pool } from '../db/mysql.js';
import type { PaginationParams } from '../utils/pagination.utils.js';
import type {
  CreateCashDepositInput,
  CashDayDetail,
  CashDaySale,
  CashDaySummary,
  CashSummaryResponse,
  CreateCashWithdrawalInput,
  UpdateCashInitialInput,
  VoidCashWithdrawalInput,
} from './cash.schema.js';
import type {
  CashDayRowDB,
  CashSaleRowDB,
  CashWithdrawalRowDB,
} from './cash.types.js';

interface CountRow extends RowDataPacket {
  total: number;
}

interface TotalsRow extends RowDataPacket {
  total_cash: number;
  total_card: number;
}

function isValidDateInput(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeDay(value: string | Date): string {
  if (typeof value === 'string') {
    const maybeDate = new Date(`${value}T00:00:00.000Z`);
    if (!Number.isNaN(maybeDate.getTime()) && isValidDateInput(value)) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().slice(0, 10);
  }
  return value.toISOString().slice(0, 10);
}

function normalizeDateTime(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

function mapSummaryRow(row: CashDayRowDB): CashDaySummary {
  const initialCash = Number(row.initial_cash);
  const initialCard = Number(row.initial_card);
  const salesCash = Number(row.sales_cash);
  const salesCard = Number(row.sales_card);
  const depositsCash = Number(row.deposits_cash);
  const depositsCard = Number(row.deposits_card);
  const withdrawalsCash = Number(row.withdrawals_cash);
  const withdrawalsCard = Number(row.withdrawals_card);

  return {
    day: normalizeDay(row.day_date),
    salesCount: Number(row.sales_count),
    itemsCount: Number(row.items_count),
    initialCash,
    initialCard,
    salesCash,
    salesCard,
    depositsCash,
    depositsCard,
    withdrawalsCash,
    withdrawalsCard,
    currentCash: initialCash + salesCash + depositsCash - withdrawalsCash,
    currentCard: initialCard + salesCard + depositsCard - withdrawalsCard,
  };
}

function buildDateWhere(from?: string, to?: string): {
  whereSql: string;
  params: string[];
} {
  const clauses: string[] = [];
  const params: string[] = [];

  if (from) {
    clauses.push('d.day_date >= ?');
    params.push(from);
  }

  if (to) {
    clauses.push('d.day_date <= ?');
    params.push(to);
  }

  return {
    whereSql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  };
}

function buildDaySetSql(): string {
  return `
    FROM (
      SELECT DISTINCT day_date
      FROM (
        SELECT DATE(s.sold_at) AS day_date
        FROM sales s
        UNION ALL
        SELECT cb.day_date AS day_date
        FROM cash_daily_balances cb
        UNION ALL
        SELECT cw.day_date AS day_date
        FROM cash_withdrawals cw
      ) day_sources
    ) d
  `;
}

function buildSummarySql(whereSql: string): string {
  return `
    SELECT
      d.day_date,
      COALESCE(sales_agg.sales_count, 0) AS sales_count,
      COALESCE(sales_agg.items_count, 0) AS items_count,
      COALESCE(bal.initial_cash, 0) AS initial_cash,
      COALESCE(bal.initial_card, 0) AS initial_card,
      COALESCE(sales_agg.sales_cash, 0) AS sales_cash,
      COALESCE(sales_agg.sales_card, 0) AS sales_card,
      COALESCE(dep_agg.deposits_cash, 0) AS deposits_cash,
      COALESCE(dep_agg.deposits_card, 0) AS deposits_card,
      COALESCE(withdraw_agg.withdrawals_cash, 0) AS withdrawals_cash,
      COALESCE(withdraw_agg.withdrawals_card, 0) AS withdrawals_card
    ${buildDaySetSql()}
    LEFT JOIN (
      SELECT
        DATE(s.sold_at) AS day_date,
        COUNT(*) AS sales_count,
        COALESCE(SUM(s.items_count), 0) AS items_count,
        COALESCE(SUM(CASE WHEN COALESCE(s.payment_method, 'cash') = 'cash' THEN s.total_sale ELSE 0 END), 0) AS sales_cash,
        COALESCE(SUM(CASE WHEN COALESCE(s.payment_method, 'cash') = 'card' THEN s.total_sale ELSE 0 END), 0) AS sales_card
      FROM sales s
      GROUP BY DATE(s.sold_at)
    ) sales_agg ON sales_agg.day_date = d.day_date
    LEFT JOIN cash_daily_balances bal ON bal.day_date = d.day_date
    LEFT JOIN (
      SELECT
        cw.day_date,
        COALESCE(SUM(CASE WHEN cw.movement_type = 'in' AND cw.payment_method = 'cash' THEN cw.amount ELSE 0 END), 0) AS deposits_cash,
        COALESCE(SUM(CASE WHEN cw.movement_type = 'in' AND cw.payment_method = 'card' THEN cw.amount ELSE 0 END), 0) AS deposits_card
      FROM cash_withdrawals cw
      WHERE cw.voided_at IS NULL
      GROUP BY cw.day_date
    ) dep_agg ON dep_agg.day_date = d.day_date
    LEFT JOIN (
      SELECT
        cw.day_date,
        COALESCE(SUM(CASE WHEN cw.movement_type = 'out' AND cw.payment_method = 'cash' THEN cw.amount ELSE 0 END), 0) AS withdrawals_cash,
        COALESCE(SUM(CASE WHEN cw.movement_type = 'out' AND cw.payment_method = 'card' THEN cw.amount ELSE 0 END), 0) AS withdrawals_card
      FROM cash_withdrawals cw
      WHERE cw.voided_at IS NULL
      GROUP BY cw.day_date
    ) withdraw_agg ON withdraw_agg.day_date = d.day_date
    ${whereSql}
  `;
}

async function getDaySummaryByDate(
  day: string,
  connection?: PoolConnection,
): Promise<CashDaySummary> {
  const executor = connection ?? pool;
  const [rows] = await executor.query<CashDayRowDB[]>(
    `
      ${buildSummarySql('WHERE d.day_date = ?')}
      ORDER BY d.day_date DESC
      LIMIT 1
    `,
    [day],
  );

  const row = rows[0];
  if (!row) {
    return {
      day,
      salesCount: 0,
      itemsCount: 0,
      initialCash: 0,
      initialCard: 0,
      salesCash: 0,
      salesCard: 0,
      depositsCash: 0,
      depositsCard: 0,
      withdrawalsCash: 0,
      withdrawalsCard: 0,
      currentCash: 0,
      currentCard: 0,
    };
  }

  return mapSummaryRow(row);
}

export class CashModel {
  static normalizeDateFilter(value?: string): string | undefined {
    if (!value) return undefined;
    return isValidDateInput(value) ? value : undefined;
  }

  static async getSummaryByDay(
    pagination: PaginationParams,
    from?: string,
    to?: string,
  ): Promise<CashSummaryResponse> {
    const whereData = buildDateWhere(from, to);

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        ${buildDaySetSql()}
        ${whereData.whereSql}
      `,
      whereData.params,
    );

    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query<CashDayRowDB[]>(
      `
        ${buildSummarySql(whereData.whereSql)}
        ORDER BY d.day_date DESC
        LIMIT ? OFFSET ?
      `,
      [...whereData.params, pagination.limit, pagination.offset],
    );

    const items = rows.map(mapSummaryRow);
    const [totalsRows] = await pool.query<TotalsRow[]>(
      `
        SELECT
          COALESCE(SUM(day_data.initial_cash + day_data.sales_cash + day_data.deposits_cash - day_data.withdrawals_cash), 0) AS total_cash,
          COALESCE(SUM(day_data.initial_card + day_data.sales_card + day_data.deposits_card - day_data.withdrawals_card), 0) AS total_card
        FROM (
          ${buildSummarySql(whereData.whereSql)}
        ) day_data
      `,
      whereData.params,
    );

    const totalsRow = totalsRows[0];
    const totals = {
      cash: Number(totalsRow?.total_cash ?? 0),
      card: Number(totalsRow?.total_card ?? 0),
    };

    return {
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
      totals,
    };
  }

  static async getDayDetail(day: string): Promise<CashDayDetail> {
    const summary = await getDaySummaryByDate(day);

    const [salesRows] = await pool.query<CashSaleRowDB[]>(
      `
        SELECT
          s.id,
          s.sold_at,
          s.items_count,
          s.total_sale,
          COALESCE(s.payment_method, 'cash') AS payment_method
        FROM sales s
        WHERE DATE(s.sold_at) = ?
        ORDER BY s.sold_at DESC, s.id DESC
      `,
      [day],
    );

    const sales: CashDaySale[] = salesRows.map((row) => ({
      saleId: row.id,
      soldAt: normalizeDateTime(row.sold_at),
      totalItems: Number(row.items_count),
      totalAmount: Number(row.total_sale),
      paymentMethod: row.payment_method === 'card' ? 'card' : 'cash',
    }));

    const [withdrawalRows] = await pool.query<CashWithdrawalRowDB[]>(
      `
        SELECT
          cw.id,
          cw.movement_type,
          cw.payment_method,
          cw.amount,
          cw.reason,
          cw.reference,
          cw.note,
          cw.created_at,
          cw.voided_at,
          cw.voided_reason
        FROM cash_withdrawals cw
        WHERE cw.day_date = ?
        ORDER BY cw.created_at DESC, cw.id DESC
      `,
      [day],
    );

    const withdrawals = withdrawalRows.map((row) => ({
      id: row.id,
      movementType: row.movement_type,
      paymentMethod: row.payment_method,
      amount: Number(row.amount),
      reason: row.reason,
      reference: row.reference,
      note: row.note,
      createdAt: normalizeDateTime(row.created_at),
      isVoided: row.voided_at !== null,
      voidedAt: row.voided_at ? normalizeDateTime(row.voided_at) : null,
      voidedReason: row.voided_reason,
    }));

    return {
      summary,
      sales,
      withdrawals,
    };
  }

  static async updateInitialBalance(
    day: string,
    data: UpdateCashInitialInput,
  ): Promise<CashDayDetail> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO cash_daily_balances (day_date, initial_cash, initial_card)
          VALUES (?, ?, ?)
          ON DUPLICATE KEY UPDATE
            initial_cash = VALUES(initial_cash),
            initial_card = VALUES(initial_card)
        `,
        [day, data.cash, data.card],
      );

      const summary = await getDaySummaryByDate(day, connection);
      if (summary.currentCash < 0 || summary.currentCard < 0) {
        throw {
          message:
            'El monto inicial no puede dejar saldo negativo considerando ventas y retiros.',
          statusCode: 409,
        };
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getDayDetail(day);
  }

  static async createWithdrawal(
    day: string,
    data: CreateCashWithdrawalInput,
  ): Promise<CashDayDetail> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO cash_daily_balances (day_date, initial_cash, initial_card)
          VALUES (?, 0, 0)
          ON DUPLICATE KEY UPDATE day_date = VALUES(day_date)
        `,
        [day],
      );

      const summary = await getDaySummaryByDate(day, connection);
      const available =
        data.paymentMethod === 'cash' ? summary.currentCash : summary.currentCard;

      if (data.amount > available) {
        throw {
          message: `No hay saldo suficiente en ${data.paymentMethod === 'cash' ? 'efectivo' : 'tarjeta'}. Disponible: ${available}.`,
          statusCode: 409,
        };
      }

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO cash_withdrawals (
            day_date,
            movement_type,
            payment_method,
            amount,
            reason,
            reference,
            note
          )
          VALUES (?, 'out', ?, ?, ?, ?, ?)
        `,
        [
          day,
          data.paymentMethod,
          data.amount,
          data.reason,
          data.reference ?? null,
          data.note ?? null,
        ],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getDayDetail(day);
  }

  static async createDeposit(
    day: string,
    data: CreateCashDepositInput,
  ): Promise<CashDayDetail> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO cash_daily_balances (day_date, initial_cash, initial_card)
          VALUES (?, 0, 0)
          ON DUPLICATE KEY UPDATE day_date = VALUES(day_date)
        `,
        [day],
      );

      await connection.query<ResultSetHeader>(
        `
          INSERT INTO cash_withdrawals (
            day_date,
            movement_type,
            payment_method,
            amount,
            reason,
            reference,
            note
          )
          VALUES (?, 'in', ?, ?, ?, ?, ?)
        `,
        [
          day,
          data.paymentMethod,
          data.amount,
          data.reason,
          data.reference ?? null,
          data.note ?? null,
        ],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getDayDetail(day);
  }

  static async voidWithdrawal(
    day: string,
    withdrawalId: number,
    data: VoidCashWithdrawalInput,
  ): Promise<CashDayDetail> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query<CashWithdrawalRowDB[]>(
        `
          SELECT
            cw.id,
            cw.day_date,
            cw.movement_type,
            cw.payment_method,
            cw.amount,
            cw.reason,
            cw.reference,
            cw.note,
            cw.created_at,
            cw.voided_at,
            cw.voided_reason
          FROM cash_withdrawals cw
          WHERE cw.id = ?
            AND cw.day_date = ?
          FOR UPDATE
        `,
        [withdrawalId, day],
      );

      const current = rows[0];
      if (!current) {
        throw {
          message: 'Movimiento no encontrado para ese dia.',
          statusCode: 404,
        };
      }

      if (current.voided_at !== null) {
        throw {
          message: 'El movimiento ya fue anulado.',
          statusCode: 409,
        };
      }

      await connection.query<ResultSetHeader>(
        `
          UPDATE cash_withdrawals
          SET
            voided_at = NOW(),
            voided_reason = ?
          WHERE id = ?
        `,
        [data.reason, withdrawalId],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getDayDetail(day);
  }
}
