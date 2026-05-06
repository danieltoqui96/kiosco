import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/mysql.js';
import type {
  PaginatedResult,
  PaginationParams,
} from '../utils/pagination.utils.js';
import type {
  CreateSale,
  SaleDetail,
  SaleProduct,
  SaleSummary,
} from './sales.schema.js';
import type {
  SaleItemRowDB,
  SaleProductRowDB,
  SaleSummaryRowDB,
} from './sales.types.js';

interface CountRow extends RowDataPacket {
  total: number;
}

interface NormalizedSaleItemInput {
  productId: number;
  quantity: number;
}

interface TransactionProductRow extends RowDataPacket {
  id: number;
  codebar: string;
  name: string;
  brand: string;
  sale_price: number;
  purchase_price: number;
  stock: number;
  is_active: number;
}

function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function mapSaleSummary(row: SaleSummaryRowDB): SaleSummary {
  return {
    id: row.id,
    createdAt: formatDateTime(row.created_at),
    paymentMethod: row.payment_method === 'card' ? 'card' : 'cash',
    totalAmount: Number(row.total_amount),
    totalItems: Number(row.total_items),
  };
}

function normalizeItems(items: CreateSale['items']): NormalizedSaleItemInput[] {
  const map = new Map<number, number>();

  items.forEach((item) => {
    const currentQuantity = map.get(item.productId) ?? 0;
    map.set(item.productId, currentQuantity + item.quantity);
  });

  return Array.from(map.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function buildSalesWhere(search?: string): {
  whereSql: string;
  whereParams: unknown[];
} {
  if (!search) return { whereSql: '', whereParams: [] };

  const value = `%${search}%`;
  return {
    whereSql: `
      WHERE (
        CAST(s.id AS CHAR) LIKE ?
        OR EXISTS (
          SELECT 1
          FROM sale_items si_search
          WHERE si_search.sale_id = s.id
          AND (
            si_search.product_name LIKE ?
            OR si_search.product_codebar LIKE ?
          )
        )
      )
    `,
    whereParams: [value, value, value],
  };
}

export class SalesModel {
  static async getAllSales(
    pagination: PaginationParams,
    search?: string,
  ): Promise<PaginatedResult<SaleSummary>> {
    const { whereSql, whereParams } = buildSalesWhere(search);

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM sales s
        ${whereSql}
      `,
      whereParams,
    );

    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query<SaleSummaryRowDB[]>(
      `
        SELECT
          s.id,
          s.sold_at AS created_at,
          COALESCE(s.payment_method, 'cash') AS payment_method,
          CAST(s.total_sale AS SIGNED) AS total_amount,
          CAST(s.items_count AS SIGNED) AS total_items
        FROM sales s
        ${whereSql}
        ORDER BY s.id DESC
        LIMIT ? OFFSET ?
      `,
      [...whereParams, pagination.limit, pagination.offset],
    );

    return {
      items: rows.map(mapSaleSummary),
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
    };
  }

  static async getSaleById(id: number): Promise<SaleDetail | null> {
    const [summaryRows] = await pool.query<SaleSummaryRowDB[]>(
      `
        SELECT
          s.id,
          s.sold_at AS created_at,
          COALESCE(s.payment_method, 'cash') AS payment_method,
          CAST(s.total_sale AS SIGNED) AS total_amount,
          CAST(s.items_count AS SIGNED) AS total_items
        FROM sales s
        WHERE s.id = ?
      `,
      [id],
    );

    const summary = summaryRows[0];
    if (!summary) return null;

    const [itemRows] = await pool.query<SaleItemRowDB[]>(
      `
        SELECT
          si.product_id,
          si.product_codebar,
          si.product_name,
          COALESCE(b.name, 'Sin marca') AS brand_name,
          CAST(si.quantity AS SIGNED) AS quantity,
          CAST(si.unit_sale_price AS SIGNED) AS unit_price,
          CAST(si.line_sale_total AS SIGNED) AS subtotal
        FROM sale_items si
        LEFT JOIN products p ON p.id = si.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
      `,
      [id],
    );

    return {
      ...mapSaleSummary(summary),
      items: itemRows.map((item) => ({
        productId: item.product_id,
        productCodebar: item.product_codebar,
        productName: item.product_name,
        brandName: item.brand_name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
        subtotal: Number(item.subtotal),
      })),
    };
  }

  static async getSaleProducts(
    pagination: PaginationParams,
    search?: string,
  ): Promise<PaginatedResult<SaleProduct>> {
    const whereClauses = ['p.is_active = 1', 'p.stock > 0'];
    const whereParams: unknown[] = [];

    if (search) {
      whereClauses.push('(p.name LIKE ? OR p.codebar LIKE ? OR b.name LIKE ?)');
      const value = `%${search}%`;
      whereParams.push(value, value, value);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM products p
        INNER JOIN brands b ON b.id = p.brand_id
        ${whereSql}
      `,
      whereParams,
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query<SaleProductRowDB[]>(
      `
        SELECT
          p.id,
          p.codebar,
          p.name,
          b.name AS brand,
          p.sale_price,
          p.stock,
          p.is_active
        FROM products p
        INNER JOIN brands b ON b.id = p.brand_id
        ${whereSql}
        ORDER BY p.name ASC
        LIMIT ? OFFSET ?
      `,
      [...whereParams, pagination.limit, pagination.offset],
    );

    return {
      items: rows.map((row) => ({
        id: row.id,
        codebar: row.codebar,
        name: row.name,
        brand: row.brand,
        salePrice: row.sale_price,
        stock: row.stock,
      })),
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
    };
  }

  static async addSale(data: CreateSale): Promise<SaleDetail> {
    const normalizedItems = normalizeItems(data.items);
    const productIds = normalizedItems.map((item) => item.productId);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const placeholders = productIds.map(() => '?').join(', ');
      const [productRows] = await connection.query<TransactionProductRow[]>(
        `
          SELECT
            p.id,
            p.codebar,
            p.name,
            b.name AS brand,
            p.sale_price,
            p.purchase_price,
            p.stock,
            p.is_active
          FROM products p
          INNER JOIN brands b ON b.id = p.brand_id
          WHERE p.id IN (${placeholders})
          FOR UPDATE
        `,
        productIds,
      );

      const productsById = new Map(productRows.map((row) => [row.id, row]));

      normalizedItems.forEach((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw {
            message: `Producto ${item.productId} no encontrado.`,
            statusCode: 404,
          };
        }

        if (product.is_active !== 1) {
          throw {
            message: `El producto "${product.name}" esta inactivo.`,
            statusCode: 409,
          };
        }

        if (item.quantity > product.stock) {
          throw {
            message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`,
            statusCode: 409,
          };
        }
      });

      const itemsCount = normalizedItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalSale = normalizedItems.reduce((acc, item) => {
        const product = productsById.get(item.productId);
        if (!product) return acc;
        return acc + item.quantity * product.sale_price;
      }, 0);
      const totalCost = normalizedItems.reduce((acc, item) => {
        const product = productsById.get(item.productId);
        if (!product) return acc;
        return acc + item.quantity * product.purchase_price;
      }, 0);
      const profit = totalSale - totalCost;
      const soldAt = data.soldAt ? new Date(data.soldAt) : new Date();
      if (Number.isNaN(soldAt.getTime())) {
        throw {
          message: 'Fecha de venta invalida.',
          statusCode: 400,
        };
      }

      const [saleInsert] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO sales (sold_at, payment_method, items_count, total_sale, total_cost, profit)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [soldAt, data.paymentMethod, itemsCount, totalSale, totalCost, profit],
      );

      const saleId = saleInsert.insertId;

      for (const item of normalizedItems) {
        const product = productsById.get(item.productId);
        if (!product) continue;

        const lineSaleTotal = item.quantity * product.sale_price;
        const lineCostTotal = item.quantity * product.purchase_price;

        await connection.query<ResultSetHeader>(
          `
            INSERT INTO sale_items (
              sale_id,
              product_id,
              product_codebar,
              product_name,
              quantity,
              unit_sale_price,
              unit_purchase_price,
              line_sale_total,
              line_cost_total
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            saleId,
            product.id,
            product.codebar,
            product.name,
            item.quantity,
            product.sale_price,
            product.purchase_price,
            lineSaleTotal,
            lineCostTotal,
          ],
        );

        await connection.query<ResultSetHeader>(
          `
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
          `,
          [item.quantity, product.id],
        );
      }

      await connection.commit();

      const sale = await this.getSaleById(saleId);
      if (!sale) {
        throw {
          message: 'Venta creada pero no se pudo recuperar.',
          statusCode: 500,
        };
      }

      return sale;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
