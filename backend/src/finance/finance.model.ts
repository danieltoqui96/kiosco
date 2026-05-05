import { pool } from '../db/mysql.js';
import type {
  DailySaleItemRow,
  DailySaleRow,
  DailySummaryRow,
  FinanceDailyDetail,
  FinanceDailySaleDetail,
  FinanceDailySaleItem,
  FinanceDailySummary,
} from './finance.types.js';

function toIsoDateTime(value: Date | string): string {
  return new Date(value).toISOString();
}

function toDateString(value: Date | string): string {
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

export class FinanceModel {
  static async getDailySummary(
    from?: string,
    to?: string,
  ): Promise<FinanceDailySummary[]> {
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (from) {
      whereClauses.push('DATE(s.sold_at) >= ?');
      params.push(from);
    }

    if (to) {
      whereClauses.push('DATE(s.sold_at) <= ?');
      params.push(to);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [rows] = await pool.query<DailySummaryRow[]>(
      `
        SELECT
          DATE(s.sold_at) AS day,
          COUNT(*) AS salesCount,
          COALESCE(SUM(s.items_count), 0) AS itemsCount,
          COALESCE(SUM(s.total_sale), 0) AS totalSale,
          COALESCE(SUM(s.total_cost), 0) AS totalCost,
          COALESCE(SUM(s.profit), 0) AS profit
        FROM sales s
        ${whereSql}
        GROUP BY DATE(s.sold_at)
        ORDER BY day DESC
      `,
      params,
    );

    return rows.map((row) => ({
      day: toDateString(row.day),
      salesCount: row.salesCount,
      itemsCount: row.itemsCount,
      totalSale: row.totalSale,
      totalCost: row.totalCost,
      profit: row.profit,
    }));
  }

  static async getDailyDetail(day: string): Promise<FinanceDailyDetail> {
    const [saleRows] = await pool.query<DailySaleRow[]>(
      `
        SELECT
          id,
          sold_at,
          items_count,
          total_sale,
          total_cost,
          profit
        FROM sales
        WHERE DATE(sold_at) = ?
        ORDER BY sold_at DESC, id DESC
      `,
      [day],
    );

    if (saleRows.length === 0) {
      return {
        day,
        salesCount: 0,
        itemsCount: 0,
        totalSale: 0,
        totalCost: 0,
        profit: 0,
        sales: [],
      };
    }

    const saleIds = saleRows.map((row) => row.id);
    const [itemRows] = await pool.query<DailySaleItemRow[]>(
      `
        SELECT
          id,
          sale_id,
          product_id,
          product_codebar,
          product_name,
          quantity,
          unit_sale_price,
          unit_purchase_price,
          line_sale_total,
          line_cost_total
        FROM sale_items
        WHERE sale_id IN (?)
        ORDER BY sale_id DESC, id ASC
      `,
      [saleIds],
    );

    const itemsBySaleId = new Map<number, FinanceDailySaleItem[]>();
    itemRows.forEach((row) => {
      const current = itemsBySaleId.get(row.sale_id) ?? [];
      current.push({
        id: row.id,
        saleId: row.sale_id,
        productId: row.product_id,
        codebar: row.product_codebar,
        name: row.product_name,
        quantity: row.quantity,
        unitSalePrice: row.unit_sale_price,
        unitPurchasePrice: row.unit_purchase_price,
        lineSaleTotal: row.line_sale_total,
        lineCostTotal: row.line_cost_total,
      });
      itemsBySaleId.set(row.sale_id, current);
    });

    const sales: FinanceDailySaleDetail[] = saleRows.map((row) => ({
      id: row.id,
      soldAt: toIsoDateTime(row.sold_at),
      itemsCount: row.items_count,
      totalSale: row.total_sale,
      totalCost: row.total_cost,
      profit: row.profit,
      items: itemsBySaleId.get(row.id) ?? [],
    }));

    return {
      day,
      salesCount: sales.length,
      itemsCount: sales.reduce((acc, sale) => acc + sale.itemsCount, 0),
      totalSale: sales.reduce((acc, sale) => acc + sale.totalSale, 0),
      totalCost: sales.reduce((acc, sale) => acc + sale.totalCost, 0),
      profit: sales.reduce((acc, sale) => acc + sale.profit, 0),
      sales,
    };
  }
}
