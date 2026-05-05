import type { PoolConnection, ResultSetHeader } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/mysql.js';
import type { PaginatedResult, PaginationParams } from '../utils/pagination.utils.js';
import type { CreateSaleInput, UpdateSaleInput } from './sales.schema.js';
import type {
  CashboxBalances,
  CashboxRow,
  PaymentMethod,
  Sale,
  SaleItem,
  SaleItemRow,
  SaleProduct,
  SaleProductRow,
  SaleRow,
  SaleSummary,
} from './sales.types.js';

interface CountRow extends RowDataPacket {
  total: number;
}

function toIsoDateTime(value: Date | string): string {
  return new Date(value).toISOString();
}

function toMySqlDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw { message: 'Fecha de venta invalida.', statusCode: 400 };
  }
  return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

function toIsoDateTimeOrNow(value: Date | string | null | undefined): string {
  if (!value) return new Date().toISOString();
  return new Date(value).toISOString();
}

function mapSaleItemRow(row: SaleItemRow): SaleItem {
  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id,
    codebar: row.product_codebar,
    name: row.product_name,
    brand: row.product_brand ?? '',
    stock: row.product_stock ?? 0,
    quantity: row.quantity,
    unitSalePrice: row.unit_sale_price,
    unitPurchasePrice: row.unit_purchase_price,
    lineSaleTotal: row.line_sale_total,
    lineCostTotal: row.line_cost_total,
  };
}

function mapSaleRow(row: SaleRow, items: SaleItem[]): Sale {
  return {
    id: row.id,
    soldAt: toIsoDateTime(row.sold_at),
    paymentMethod: row.payment_method,
    itemsCount: row.items_count,
    totalSale: row.total_sale,
    totalCost: row.total_cost,
    profit: row.profit,
    items,
  };
}

function mapSaleSummaryRow(row: SaleRow): SaleSummary {
  return {
    id: row.id,
    soldAt: toIsoDateTime(row.sold_at),
    paymentMethod: row.payment_method,
    itemsCount: row.items_count,
    totalSale: row.total_sale,
    totalCost: row.total_cost,
    profit: row.profit,
  };
}

export class SalesModel {
  private static normalizePaymentMethod(
    value: PaymentMethod | undefined,
  ): PaymentMethod {
    return value === 'card' ? 'card' : 'cash';
  }

  private static async ensureCashboxRowWithConnection(
    connection: PoolConnection,
  ): Promise<void> {
    await connection.query(
      `
        INSERT INTO cashbox_balances (id, cash_balance, card_balance)
        VALUES (1, 0, 0)
        ON DUPLICATE KEY UPDATE id = id
      `,
    );
  }

  private static async applyCashboxDelta(
    connection: PoolConnection,
    paymentMethod: PaymentMethod,
    amountDelta: number,
  ): Promise<void> {
    await this.ensureCashboxRowWithConnection(connection);

    if (paymentMethod === 'card') {
      await connection.query<ResultSetHeader>(
        `
          UPDATE cashbox_balances
          SET card_balance = card_balance + ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `,
        [amountDelta],
      );
      return;
    }

    await connection.query<ResultSetHeader>(
      `
        UPDATE cashbox_balances
        SET cash_balance = cash_balance + ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1
      `,
      [amountDelta],
    );
  }

  static async getCashboxBalances(): Promise<CashboxBalances> {
    const connection = await pool.getConnection();

    try {
      await this.ensureCashboxRowWithConnection(connection);

      const [rows] = await connection.query<CashboxRow[]>(
        `
          SELECT id, cash_balance, card_balance, updated_at
          FROM cashbox_balances
          WHERE id = 1
        `,
      );

      const row = rows[0];
      if (!row) {
        return {
          cash: 0,
          card: 0,
          total: 0,
          updatedAt: new Date().toISOString(),
        };
      }

      return {
        cash: row.cash_balance,
        card: row.card_balance,
        total: row.cash_balance + row.card_balance,
        updatedAt: toIsoDateTimeOrNow(row.updated_at),
      };
    } finally {
      connection.release();
    }
  }

  static async setCashboxBalances(
    cash: number,
    card: number,
  ): Promise<CashboxBalances> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      await this.ensureCashboxRowWithConnection(connection);

      await connection.query<ResultSetHeader>(
        `
          UPDATE cashbox_balances
          SET cash_balance = ?, card_balance = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = 1
        `,
        [cash, card],
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return this.getCashboxBalances();
  }

  static async resetCashboxBalances(): Promise<CashboxBalances> {
    return this.setCashboxBalances(0, 0);
  }

  static async getSales(
    pagination: PaginationParams,
    filters: {
      from?: string;
      to?: string;
    },
  ): Promise<PaginatedResult<SaleSummary>> {
    const whereClauses: string[] = [];
    const whereParams: unknown[] = [];

    if (filters.from) {
      whereClauses.push('DATE(sold_at) >= ?');
      whereParams.push(filters.from);
    }

    if (filters.to) {
      whereClauses.push('DATE(sold_at) <= ?');
      whereParams.push(filters.to);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM sales
        ${whereSql}
      `,
      whereParams,
    );

    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query<SaleRow[]>(
      `
        SELECT
          id,
          sold_at,
          payment_method,
          items_count,
          total_sale,
          total_cost,
          profit
        FROM sales
        ${whereSql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `,
      [...whereParams, pagination.limit, pagination.offset],
    );

    return {
      items: rows.map(mapSaleSummaryRow),
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
    };
  }

  static async getAvailableProducts(
    pagination: PaginationParams,
    search?: string,
  ): Promise<PaginatedResult<SaleProduct>> {
    const whereClauses = ['p.is_active = 1', 'p.stock > 0'];
    const whereParams: unknown[] = [];

    if (search) {
      whereClauses.push(
        '(p.name LIKE ? OR p.codebar LIKE ? OR b.name LIKE ? OR c.name LIKE ?)',
      );
      const searchValue = `%${search}%`;
      whereParams.push(searchValue, searchValue, searchValue, searchValue);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const [countRows] = await pool.query<CountRow[]>(
      `
        SELECT COUNT(*) AS total
        FROM products p
        INNER JOIN brands b ON b.id = p.brand_id
        INNER JOIN categories c ON c.id = p.category_id
        ${whereSql}
      `,
      whereParams,
    );

    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query<SaleProductRow[]>(
      `
        SELECT
          p.id,
          p.codebar,
          p.name,
          b.name AS brand,
          c.name AS category,
          p.sale_price,
          p.purchase_price,
          p.stock,
          p.is_active
        FROM products p
        INNER JOIN brands b ON b.id = p.brand_id
        INNER JOIN categories c ON c.id = p.category_id
        ${whereSql}
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
      `,
      [...whereParams, pagination.limit, pagination.offset],
    );

    const items: SaleProduct[] = rows.map((row) => ({
      id: row.id,
      codebar: row.codebar,
      name: row.name,
      brand: row.brand,
      category: row.category,
      salePrice: row.sale_price,
      stock: row.stock,
    }));

    return {
      items,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
    };
  }

  static async getSaleById(saleId: number): Promise<Sale | null> {
    const [saleRows] = await pool.query<SaleRow[]>(
      `
        SELECT
          id,
          sold_at,
          payment_method,
          items_count,
          total_sale,
          total_cost,
          profit
        FROM sales
        WHERE id = ?
      `,
      [saleId],
    );

    const saleRow = saleRows[0];
    if (!saleRow) return null;

    const [itemRows] = await pool.query<SaleItemRow[]>(
      `
        SELECT
          si.id,
          si.sale_id,
          si.product_id,
          si.product_codebar,
          si.product_name,
          b.name AS product_brand,
          p.stock AS product_stock,
          si.quantity,
          si.unit_sale_price,
          si.unit_purchase_price,
          si.line_sale_total,
          si.line_cost_total
        FROM sale_items si
        LEFT JOIN products p ON p.id = si.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
      `,
      [saleId],
    );

    return mapSaleRow(saleRow, itemRows.map(mapSaleItemRow));
  }

  static async createSale(data: CreateSaleInput): Promise<Sale> {
    return this.createSaleWithOptionalDate(data, data.soldAt);
  }

  static async updateSale(saleId: number, data: UpdateSaleInput): Promise<Sale> {
    const normalizedByProductId = new Map<number, number>();
    data.items.forEach((item) => {
      const current = normalizedByProductId.get(item.productId) ?? 0;
      normalizedByProductId.set(item.productId, current + item.quantity);
    });

    const nextItems = Array.from(normalizedByProductId.entries()).map(
      ([productId, quantity]) => ({ productId, quantity }),
    );

    if (nextItems.length === 0) {
      throw { message: 'La venta debe tener al menos un producto.', statusCode: 400 };
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.query<SaleRow[]>(
        `
          SELECT
            id,
            sold_at,
            payment_method,
            items_count,
            total_sale,
            total_cost,
            profit
          FROM sales
          WHERE id = ?
          FOR UPDATE
        `,
        [saleId],
      );

      if (saleRows.length === 0) {
        throw { message: 'Venta no encontrada.', statusCode: 404 };
      }
      const currentSale = saleRows[0]!;
      const previousPaymentMethod = this.normalizePaymentMethod(currentSale.payment_method);
      const nextPaymentMethod =
        data.paymentMethod === undefined
          ? previousPaymentMethod
          : this.normalizePaymentMethod(data.paymentMethod);

      const [currentItemRows] = await connection.query<SaleItemRow[]>(
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
          WHERE sale_id = ?
          FOR UPDATE
        `,
        [saleId],
      );

      const oldByProductId = new Map<
        number,
        {
          quantity: number;
          unitSalePrice: number;
          unitPurchasePrice: number;
        }
      >();

      currentItemRows.forEach((item) => {
        const existing = oldByProductId.get(item.product_id);
        if (!existing) {
          oldByProductId.set(item.product_id, {
            quantity: item.quantity,
            unitSalePrice: item.unit_sale_price,
            unitPurchasePrice: item.unit_purchase_price,
          });
          return;
        }

        oldByProductId.set(item.product_id, {
          quantity: existing.quantity + item.quantity,
          unitSalePrice: existing.unitSalePrice,
          unitPurchasePrice: existing.unitPurchasePrice,
        });
      });

      const involvedProductIds = Array.from(
        new Set([
          ...Array.from(oldByProductId.keys()),
          ...nextItems.map((item) => item.productId),
        ]),
      );

      if (involvedProductIds.length === 0) {
        throw { message: 'La venta no contiene productos.', statusCode: 400 };
      }

      const [productRows] = await connection.query<SaleProductRow[]>(
        `
          SELECT
            p.id,
            p.codebar,
            p.name,
            b.name AS brand,
            c.name AS category,
            p.sale_price,
            p.purchase_price,
            p.stock,
            p.is_active
          FROM products p
          INNER JOIN brands b ON b.id = p.brand_id
          INNER JOIN categories c ON c.id = p.category_id
          WHERE p.id IN (?)
          FOR UPDATE
        `,
        [involvedProductIds],
      );

      const productById = new Map<number, SaleProductRow>();
      productRows.forEach((row) => productById.set(row.id, row));

      for (const nextItem of nextItems) {
        const product = productById.get(nextItem.productId);
        if (!product) {
          throw {
            message: `Producto ${nextItem.productId} no existe.`,
            statusCode: 404,
          };
        }
      }

      for (const productId of involvedProductIds) {
        const product = productById.get(productId);
        if (!product) continue;

        const oldQuantity = oldByProductId.get(productId)?.quantity ?? 0;
        const newQuantity =
          nextItems.find((item) => item.productId === productId)?.quantity ?? 0;
        const delta = newQuantity - oldQuantity;

        if (delta > 0) {
          if (!product.is_active) {
            throw {
              message: `El producto "${product.name}" esta inactivo y no puede aumentar su venta.`,
              statusCode: 400,
            };
          }

          if (product.stock < delta) {
            throw {
              message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`,
              statusCode: 400,
            };
          }
        }

        if (delta !== 0) {
          await connection.query<ResultSetHeader>(
            `
              UPDATE products
              SET stock = stock - ?
              WHERE id = ?
            `,
            [delta, productId],
          );
        }
      }

      await connection.query<ResultSetHeader>(
        `
          DELETE FROM sale_items
          WHERE sale_id = ?
        `,
        [saleId],
      );

      const values = nextItems.map((item) => {
        const product = productById.get(item.productId);
        if (!product) {
          throw {
            message: `Producto ${item.productId} no encontrado.`,
            statusCode: 404,
          };
        }

        const oldData = oldByProductId.get(item.productId);
        const unitSalePrice = oldData?.unitSalePrice ?? product.sale_price;
        const unitPurchasePrice = oldData?.unitPurchasePrice ?? product.purchase_price;
        const lineSaleTotal = unitSalePrice * item.quantity;
        const lineCostTotal = unitPurchasePrice * item.quantity;

        return [
          saleId,
          product.id,
          product.codebar,
          product.name,
          item.quantity,
          unitSalePrice,
          unitPurchasePrice,
          lineSaleTotal,
          lineCostTotal,
        ];
      });

      await connection.query(
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
          ) VALUES ?
        `,
        [values],
      );

      const itemsCount = nextItems.reduce((acc, item) => acc + item.quantity, 0);
      const totalSale = values.reduce((acc, value) => acc + Number(value[7]), 0);
      const totalCost = values.reduce((acc, value) => acc + Number(value[8]), 0);
      const profit = totalSale - totalCost;

      if (data.soldAt) {
        const soldAtMySql = toMySqlDateTime(data.soldAt);
        await connection.query<ResultSetHeader>(
          `
            UPDATE sales
            SET sold_at = ?, payment_method = ?, items_count = ?, total_sale = ?, total_cost = ?, profit = ?
            WHERE id = ?
          `,
          [soldAtMySql, nextPaymentMethod, itemsCount, totalSale, totalCost, profit, saleId],
        );
      } else {
        await connection.query<ResultSetHeader>(
          `
            UPDATE sales
            SET payment_method = ?, items_count = ?, total_sale = ?, total_cost = ?, profit = ?
            WHERE id = ?
          `,
          [nextPaymentMethod, itemsCount, totalSale, totalCost, profit, saleId],
        );
      }

      await this.applyCashboxDelta(connection, previousPaymentMethod, -currentSale.total_sale);
      await this.applyCashboxDelta(connection, nextPaymentMethod, totalSale);

      await connection.commit();

      const updatedSale = await this.getSaleByIdWithConnection(connection, saleId);
      if (!updatedSale) {
        throw {
          message: 'No se pudo recuperar la venta actualizada.',
          statusCode: 500,
        };
      }

      return updatedSale;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async deleteSale(saleId: number): Promise<void> {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [saleRows] = await connection.query<SaleRow[]>(
        `
          SELECT
            id,
            sold_at,
            payment_method,
            items_count,
            total_sale,
            total_cost,
            profit
          FROM sales
          WHERE id = ?
          FOR UPDATE
        `,
        [saleId],
      );

      if (saleRows.length === 0) {
        throw { message: 'Venta no encontrada.', statusCode: 404 };
      }
      const saleRow = saleRows[0]!;
      const salePaymentMethod = this.normalizePaymentMethod(saleRow.payment_method);

      const [itemRows] = await connection.query<SaleItemRow[]>(
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
          WHERE sale_id = ?
          FOR UPDATE
        `,
        [saleId],
      );

      const quantityByProductId = new Map<number, number>();
      itemRows.forEach((item) => {
        quantityByProductId.set(
          item.product_id,
          (quantityByProductId.get(item.product_id) ?? 0) + item.quantity,
        );
      });

      const productIds = Array.from(quantityByProductId.keys());
      if (productIds.length > 0) {
        const [productRows] = await connection.query<SaleProductRow[]>(
          `
            SELECT
              p.id,
              p.codebar,
              p.name,
              b.name AS brand,
              c.name AS category,
              p.sale_price,
              p.purchase_price,
              p.stock,
              p.is_active
            FROM products p
            INNER JOIN brands b ON b.id = p.brand_id
            INNER JOIN categories c ON c.id = p.category_id
            WHERE p.id IN (?)
            FOR UPDATE
          `,
          [productIds],
        );

        const stockByProductId = new Map(productRows.map((row) => [row.id, row]));

        for (const productId of productIds) {
          const quantity = quantityByProductId.get(productId) ?? 0;
          const product = stockByProductId.get(productId);
          if (!product) continue;

          await connection.query<ResultSetHeader>(
            `
              UPDATE products
              SET stock = stock + ?
              WHERE id = ?
            `,
            [quantity, productId],
          );
        }
      }

      await connection.query<ResultSetHeader>(
        `
          DELETE FROM sale_items
          WHERE sale_id = ?
        `,
        [saleId],
      );

      await connection.query<ResultSetHeader>(
        `
          DELETE FROM sales
          WHERE id = ?
        `,
        [saleId],
      );

      await this.applyCashboxDelta(connection, salePaymentMethod, -saleRow.total_sale);

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  private static async createSaleWithOptionalDate(
    data: CreateSaleInput,
    soldAt?: string,
  ): Promise<Sale> {
    const paymentMethod = this.normalizePaymentMethod(data.paymentMethod);
    const normalizedByProductId = new Map<number, number>();
    data.items.forEach((item) => {
      const current = normalizedByProductId.get(item.productId) ?? 0;
      normalizedByProductId.set(item.productId, current + item.quantity);
    });

    const itemsToSell = Array.from(normalizedByProductId.entries()).map(
      ([productId, quantity]) => ({
        productId,
        quantity,
      }),
    );

    if (itemsToSell.length === 0) {
      throw { message: 'El carrito no tiene productos validos.', statusCode: 400 };
    }

    const productIds = itemsToSell.map((item) => item.productId);
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [productRows] = await connection.query<SaleProductRow[]>(
        `
          SELECT
            p.id,
            p.codebar,
            p.name,
            b.name AS brand,
            c.name AS category,
            p.sale_price,
            p.purchase_price,
            p.stock,
            p.is_active
          FROM products p
          INNER JOIN brands b ON b.id = p.brand_id
          INNER JOIN categories c ON c.id = p.category_id
          WHERE p.id IN (?)
          FOR UPDATE
        `,
        [productIds],
      );

      if (productRows.length !== productIds.length) {
        throw {
          message: 'Uno o mas productos no existen.',
          statusCode: 404,
        };
      }

      const productById = new Map<number, SaleProductRow>();
      productRows.forEach((row) => productById.set(row.id, row));

      const saleItemsPayload = itemsToSell.map((item) => {
        const product = productById.get(item.productId);
        if (!product) {
          throw {
            message: `Producto ${item.productId} no encontrado.`,
            statusCode: 404,
          };
        }

        if (!product.is_active) {
          throw {
            message: `El producto "${product.name}" esta inactivo y no se puede vender.`,
            statusCode: 400,
          };
        }

        if (product.stock < item.quantity) {
          throw {
            message: `Stock insuficiente para "${product.name}". Disponible: ${product.stock}.`,
            statusCode: 400,
          };
        }

        const lineSaleTotal = product.sale_price * item.quantity;
        const lineCostTotal = product.purchase_price * item.quantity;

        return {
          product,
          quantity: item.quantity,
          lineSaleTotal,
          lineCostTotal,
        };
      });

      const itemsCount = saleItemsPayload.reduce(
        (acc, item) => acc + item.quantity,
        0,
      );
      const totalSale = saleItemsPayload.reduce(
        (acc, item) => acc + item.lineSaleTotal,
        0,
      );
      const totalCost = saleItemsPayload.reduce(
        (acc, item) => acc + item.lineCostTotal,
        0,
      );
      const profit = totalSale - totalCost;

      const [saleResult] = await connection.query<ResultSetHeader>(
        `
          INSERT INTO sales (sold_at, payment_method, items_count, total_sale, total_cost, profit)
          VALUES (COALESCE(?, CURRENT_TIMESTAMP), ?, ?, ?, ?, ?)
        `,
        [
          soldAt ? toMySqlDateTime(soldAt) : null,
          paymentMethod,
          itemsCount,
          totalSale,
          totalCost,
          profit,
        ],
      );

      const saleId = saleResult.insertId;

      const values = saleItemsPayload.map((item) => [
        saleId,
        item.product.id,
        item.product.codebar,
        item.product.name,
        item.quantity,
        item.product.sale_price,
        item.product.purchase_price,
        item.lineSaleTotal,
        item.lineCostTotal,
      ]);

      await connection.query(
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
          ) VALUES ?
        `,
        [values],
      );

      for (const item of saleItemsPayload) {
        await connection.query<ResultSetHeader>(
          `
            UPDATE products
            SET stock = stock - ?
            WHERE id = ?
          `,
          [item.quantity, item.product.id],
        );
      }

      await this.applyCashboxDelta(connection, paymentMethod, totalSale);

      await connection.commit();

      const sale = await this.getSaleByIdWithConnection(connection, saleId);
      if (!sale) {
        throw {
          message: 'La venta se registro pero no se pudo recuperar.',
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

  private static async getSaleByIdWithConnection(
    connection: PoolConnection,
    saleId: number,
  ): Promise<Sale | null> {
    const [saleRows] = await connection.query<SaleRow[]>(
      `
        SELECT
          id,
          sold_at,
          payment_method,
          items_count,
          total_sale,
          total_cost,
          profit
        FROM sales
        WHERE id = ?
      `,
      [saleId],
    );

    const saleRow = saleRows[0];
    if (!saleRow) return null;

    const [itemRows] = await connection.query<SaleItemRow[]>(
      `
        SELECT
          si.id,
          si.sale_id,
          si.product_id,
          si.product_codebar,
          si.product_name,
          b.name AS product_brand,
          p.stock AS product_stock,
          si.quantity,
          si.unit_sale_price,
          si.unit_purchase_price,
          si.line_sale_total,
          si.line_cost_total
        FROM sale_items si
        LEFT JOIN products p ON p.id = si.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE si.sale_id = ?
        ORDER BY si.id ASC
      `,
      [saleId],
    );

    return mapSaleRow(saleRow, itemRows.map(mapSaleItemRow));
  }
}
