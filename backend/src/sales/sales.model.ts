import type { ResultSetHeader, RowDataPacket } from '../db/sqlite.js';
import { pool } from '../db/sqlite.js';
import type {
  PaginatedResult,
  PaginationParams,
} from '../utils/pagination.utils.js';
import type {
  CreateSale,
  SaleDetail,
  SaleProduct,
  SaleSummary,
  UpdateSale,
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

interface SaleItemQuantityRow extends RowDataPacket {
  product_id: number;
  quantity: number;
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
} & {
  andClauses: string[];
} {
  const andClauses: string[] = [];
  const whereParams: unknown[] = [];

  if (search) {
    const value = `%${search}%`;
    andClauses.push('CAST(s.id AS TEXT) LIKE ?');
    whereParams.push(value);
  }

  const whereSql = andClauses.length > 0 ? `WHERE ${andClauses.join(' AND ')}` : '';
  return { whereSql, whereParams, andClauses };
}

function toPaymentMethod(
  paymentMethod?: string,
): 'cash' | 'card' | undefined {
  if (paymentMethod === 'cash' || paymentMethod === 'card') {
    return paymentMethod;
  }
  return undefined;
}

function toDateFilter(dateValue?: string): string | undefined {
  if (!dateValue) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return undefined;
  return dateValue;
}

function normalizeSoldAtInput(value?: string): Date {
  const soldAt = value ? new Date(value) : new Date();
  if (Number.isNaN(soldAt.getTime())) {
    throw {
      message: 'Fecha de venta invalida.',
      statusCode: 400,
    };
  }
  return soldAt;
}

function calculateSaleTotals(
  items: NormalizedSaleItemInput[],
  productsById: Map<number, TransactionProductRow>,
) {
  const itemsCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalSale = items.reduce((acc, item) => {
    const product = productsById.get(item.productId);
    if (!product) return acc;
    return acc + item.quantity * product.sale_price;
  }, 0);
  const totalCost = items.reduce((acc, item) => {
    const product = productsById.get(item.productId);
    if (!product) return acc;
    return acc + item.quantity * product.purchase_price;
  }, 0);
  const profit = totalSale - totalCost;

  return {
    itemsCount,
    totalSale,
    totalCost,
    profit,
  };
}

async function insertSaleItemsAndApplyStock(
  connection: Awaited<ReturnType<typeof pool.getConnection>>,
  saleId: number,
  items: NormalizedSaleItemInput[],
  productsById: Map<number, TransactionProductRow>,
): Promise<void> {
  for (const item of items) {
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
          brand_name,
          quantity,
          unit_price,
          unit_sale_price,
          unit_purchase_price,
          line_sale_total,
          line_cost_total
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        saleId,
        product.id,
        product.codebar,
        product.name,
        product.brand,
        item.quantity,
        product.sale_price,
        product.sale_price,
        product.purchase_price,
        lineSaleTotal,
        lineCostTotal,
      ],
    );
  }
}

async function updateProductStockForSaleUpdate(
  connection: Awaited<ReturnType<typeof pool.getConnection>>,
  productRows: TransactionProductRow[],
  previousQuantities: Map<number, number>,
  nextQuantities: Map<number, number>,
): Promise<void> {
  for (const product of productRows) {
    const previousQuantity = previousQuantities.get(product.id) ?? 0;
    const nextQuantity = nextQuantities.get(product.id) ?? 0;
    const nextStock = product.stock + previousQuantity - nextQuantity;

    if (nextStock < 0) {
      throw {
        message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock + previousQuantity}.`,
        statusCode: 409,
      };
    }

    await connection.query<ResultSetHeader>(
      `
        UPDATE products
        SET stock = ?
        WHERE id = ?
      `,
      [nextStock, product.id],
    );
  }
}

export class SalesModel {
  static async getAllSales(
    pagination: PaginationParams,
    search?: string,
    paymentMethod?: string,
    soldDate?: string,
  ): Promise<PaginatedResult<SaleSummary>> {
    const whereData = buildSalesWhere(search);
    const normalizedPaymentMethod = toPaymentMethod(paymentMethod);
    const normalizedDate = toDateFilter(soldDate);

    if (normalizedPaymentMethod) {
      whereData.andClauses.push('COALESCE(s.payment_method, \'cash\') = ?');
      whereData.whereParams.push(normalizedPaymentMethod);
    }

    if (normalizedDate) {
      whereData.andClauses.push('DATE(s.sold_at) = ?');
      whereData.whereParams.push(normalizedDate);
    }

    const whereSql =
      whereData.andClauses.length > 0
        ? `WHERE ${whereData.andClauses.join(' AND ')}`
        : '';
    const whereParams = whereData.whereParams;

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
          CAST(s.total_sale AS INTEGER) AS total_amount,
          CAST(s.items_count AS INTEGER) AS total_items
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
          CAST(s.total_sale AS INTEGER) AS total_amount,
          CAST(s.items_count AS INTEGER) AS total_items
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
          CAST(si.quantity AS INTEGER) AS quantity,
          CAST(si.unit_sale_price AS INTEGER) AS unit_price,
          CAST(si.line_sale_total AS INTEGER) AS subtotal
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

      const { itemsCount, totalSale, totalCost, profit } = calculateSaleTotals(
        normalizedItems,
        productsById,
      );
      const soldAt = normalizeSoldAtInput(data.soldAt);

      const [saleInsert] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO sales (sold_at, payment_method, items_count, total_sale, total_cost, profit)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [soldAt, data.paymentMethod, itemsCount, totalSale, totalCost, profit],
      );

      const saleId = saleInsert.insertId;

      await insertSaleItemsAndApplyStock(connection, saleId, normalizedItems, productsById);

      for (const item of normalizedItems) {
        await connection.query<ResultSetHeader>(
          `
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
          `,
          [item.quantity, item.productId],
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

  static async updateSale(id: number, data: UpdateSale): Promise<SaleDetail | null> {
    const normalizedItems = normalizeItems(data.items);
    const nextQuantities = new Map<number, number>(
      normalizedItems.map((item) => [item.productId, item.quantity]),
    );

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id
          FROM sales
          WHERE id = ?
        `,
        [id],
      );
      if (saleRows.length === 0) {
        await connection.rollback();
        return null;
      }

      const [previousRows] = await connection.query<SaleItemQuantityRow[]>(
        `
          SELECT product_id, SUM(quantity) AS quantity
          FROM sale_items
          WHERE sale_id = ?
          GROUP BY product_id
        `,
        [id],
      );
      const previousQuantities = new Map<number, number>(
        previousRows.map((row) => [row.product_id, Number(row.quantity)]),
      );

      const productIds = Array.from(
        new Set([...previousQuantities.keys(), ...nextQuantities.keys()]),
      );

      if (productIds.length === 0) {
        throw {
          message: 'La venta debe contener al menos un producto.',
          statusCode: 400,
        };
      }

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
      });

      await updateProductStockForSaleUpdate(
        connection,
        productRows,
        previousQuantities,
        nextQuantities,
      );

      await connection.query<ResultSetHeader>(
        `
          DELETE FROM sale_items
          WHERE sale_id = ?
        `,
        [id],
      );

      await insertSaleItemsAndApplyStock(connection, id, normalizedItems, productsById);

      const { itemsCount, totalSale, totalCost, profit } = calculateSaleTotals(
        normalizedItems,
        productsById,
      );
      const soldAt = normalizeSoldAtInput(data.soldAt);

      await connection.query<ResultSetHeader>(
        `
          UPDATE sales
          SET
            sold_at = ?,
            created_at = ?,
            payment_method = ?,
            items_count = ?,
            total_sale = ?,
            total_cost = ?,
            profit = ?
          WHERE id = ?
        `,
        [
          soldAt,
          soldAt,
          data.paymentMethod,
          itemsCount,
          totalSale,
          totalCost,
          profit,
          id,
        ],
      );

      await connection.commit();

      const sale = await this.getSaleById(id);
      if (!sale) {
        throw {
          message: 'Venta actualizada pero no se pudo recuperar.',
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

  static async deleteSale(id: number): Promise<SaleDetail | null> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.query<RowDataPacket[]>(
        `
          SELECT id
          FROM sales
          WHERE id = ?
        `,
        [id],
      );
      if (saleRows.length === 0) {
        await connection.rollback();
        return null;
      }

      const saleBeforeDelete = await this.getSaleById(id);
      if (!saleBeforeDelete) {
        await connection.rollback();
        return null;
      }

      const [previousRows] = await connection.query<SaleItemQuantityRow[]>(
        `
          SELECT product_id, SUM(quantity) AS quantity
          FROM sale_items
          WHERE sale_id = ?
          GROUP BY product_id
        `,
        [id],
      );

      const productIds = previousRows.map((row) => row.product_id);
      if (productIds.length > 0) {
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
          `,
          productIds,
        );

        const stockById = new Map(productRows.map((row) => [row.id, row.stock]));
        for (const row of previousRows) {
          const currentStock = stockById.get(row.product_id);
          if (currentStock === undefined) continue;
          await connection.query<ResultSetHeader>(
            `
              UPDATE products
              SET stock = ?
              WHERE id = ?
            `,
            [currentStock + Number(row.quantity), row.product_id],
          );
        }
      }

      await connection.query<ResultSetHeader>(
        `
          DELETE FROM sale_items
          WHERE sale_id = ?
        `,
        [id],
      );

      await connection.query<ResultSetHeader>(
        `
          DELETE FROM sales
          WHERE id = ?
        `,
        [id],
      );

      await connection.commit();
      return saleBeforeDelete;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
