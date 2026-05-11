import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from './mysql.js';

interface CountRow extends RowDataPacket {
  total: number;
}

interface ForeignKeyRow extends RowDataPacket {
  CONSTRAINT_NAME: string;
}

async function hasTable(tableName: string): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
        AND table_name = ?
    `,
    [tableName],
  );
  return (rows[0]?.total ?? 0) > 0;
}

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
    `,
    [tableName, columnName],
  );
  return (rows[0]?.total ?? 0) > 0;
}

async function hasIndex(tableName: string, indexName: string): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND index_name = ?
    `,
    [tableName, indexName],
  );
  return (rows[0]?.total ?? 0) > 0;
}

async function hasForeignKey(tableName: string, constraintName: string): Promise<boolean> {
  const [rows] = await pool.query<CountRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.table_constraints
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND constraint_name = ?
        AND constraint_type = 'FOREIGN KEY'
    `,
    [tableName, constraintName],
  );
  return (rows[0]?.total ?? 0) > 0;
}

async function getForeignKeys(tableName: string): Promise<string[]> {
  const [rows] = await pool.query<ForeignKeyRow[]>(
    `
      SELECT tc.constraint_name AS CONSTRAINT_NAME
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = DATABASE()
        AND tc.table_name = ?
        AND tc.constraint_type = 'FOREIGN KEY'
    `,
    [tableName],
  );

  return rows.map((row) => row.CONSTRAINT_NAME);
}

async function ensureSalesTables(): Promise<void> {
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS sales (
        id INT NOT NULL AUTO_INCREMENT,
        sold_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash',
        items_count INT NOT NULL,
        total_sale INT NOT NULL,
        total_cost INT NOT NULL,
        profit INT NOT NULL,
        PRIMARY KEY (id),
        KEY idx_sales_sold_at (sold_at)
      ) ENGINE=InnoDB
    `,
  );

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT NOT NULL AUTO_INCREMENT,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        product_codebar VARCHAR(50) NOT NULL,
        product_name VARCHAR(100) NOT NULL,
        quantity INT NOT NULL,
        unit_sale_price INT NOT NULL,
        unit_purchase_price INT NOT NULL,
        line_sale_total INT NOT NULL,
        line_cost_total INT NOT NULL,
        PRIMARY KEY (id),
        KEY idx_sale_items_sale_id (sale_id),
        KEY idx_sale_items_product_id (product_id)
      ) ENGINE=InnoDB
    `,
  );
}

async function ensureSalesCompatibilityColumns(): Promise<void> {
  if (!(await hasColumn('sales', 'created_at'))) {
    await pool.query(
      `
        ALTER TABLE sales
        ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      `,
    );

    await pool.query(
      `
        UPDATE sales
        SET created_at = sold_at
      `,
    );
  }

  if (!(await hasColumn('sales', 'payment_method'))) {
    await pool.query(
      `
        ALTER TABLE sales
        ADD COLUMN payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash'
      `,
    );
  }

  if (!(await hasColumn('sale_items', 'unit_price'))) {
    await pool.query(
      `
        ALTER TABLE sale_items
        ADD COLUMN unit_price INT NOT NULL DEFAULT 0
      `,
    );
    await pool.query(
      `
        UPDATE sale_items
        SET unit_price = unit_sale_price
      `,
    );
  }

  if (!(await hasColumn('sale_items', 'brand_name'))) {
    await pool.query(
      `
        ALTER TABLE sale_items
        ADD COLUMN brand_name VARCHAR(100) NOT NULL DEFAULT ''
      `,
    );
  }

  if (await hasTable('products')) {
    if (await hasTable('brands')) {
      await pool.query(
        `
          UPDATE sale_items si
          LEFT JOIN products p ON p.id = si.product_id
          LEFT JOIN brands b ON b.id = p.brand_id
          SET si.brand_name = COALESCE(b.name, si.brand_name, '')
        `,
      );
    } else {
      await pool.query(
        `
          UPDATE sale_items
          SET brand_name = COALESCE(brand_name, '')
        `,
      );
    }
  }
}

async function ensureSalesIndexes(): Promise<void> {
  if (!(await hasIndex('sales', 'idx_sales_sold_at'))) {
    await pool.query(
      `
        ALTER TABLE sales
        ADD INDEX idx_sales_sold_at (sold_at)
      `,
    );
  }

  if (!(await hasIndex('sale_items', 'idx_sale_items_sale_id'))) {
    await pool.query(
      `
        ALTER TABLE sale_items
        ADD INDEX idx_sale_items_sale_id (sale_id)
      `,
    );
  }

  if (!(await hasIndex('sale_items', 'idx_sale_items_product_id'))) {
    await pool.query(
      `
        ALTER TABLE sale_items
        ADD INDEX idx_sale_items_product_id (product_id)
      `,
    );
  }
}

async function ensureSalesForeignKeys(): Promise<void> {
  const hasSales = await hasTable('sales');
  const hasItems = await hasTable('sale_items');
  const hasProducts = await hasTable('products');

  if (!hasSales || !hasItems || !hasProducts) return;

  const existingFks = new Set(await getForeignKeys('sale_items'));

  if (!existingFks.has('fk_sale_items_sale') && !(await hasForeignKey('sale_items', 'fk_sale_items_sale'))) {
    try {
      await pool.query<ResultSetHeader>(
        `
          ALTER TABLE sale_items
          ADD CONSTRAINT fk_sale_items_sale
          FOREIGN KEY (sale_id)
          REFERENCES sales (id)
          ON DELETE CASCADE
        `,
      );
    } catch (error) {
      console.warn('Warning: could not add fk_sale_items_sale', error);
    }
  }

  if (!existingFks.has('fk_sale_items_product') && !(await hasForeignKey('sale_items', 'fk_sale_items_product'))) {
    try {
      await pool.query<ResultSetHeader>(
        `
          ALTER TABLE sale_items
          ADD CONSTRAINT fk_sale_items_product
          FOREIGN KEY (product_id)
          REFERENCES products (id)
          ON DELETE RESTRICT
        `,
      );
    } catch (error) {
      console.warn('Warning: could not add fk_sale_items_product', error);
    }
  }
}

async function ensureCashTables(): Promise<void> {
  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS cash_daily_balances (
        day_date DATE NOT NULL,
        initial_cash INT NOT NULL DEFAULT 0,
        initial_card INT NOT NULL DEFAULT 0,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (day_date)
      ) ENGINE=InnoDB
    `,
  );

  await pool.query(
    `
      CREATE TABLE IF NOT EXISTS cash_withdrawals (
        id INT NOT NULL AUTO_INCREMENT,
        day_date DATE NOT NULL,
        movement_type ENUM('in', 'out') NOT NULL DEFAULT 'out',
        payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash',
        amount INT NOT NULL,
        reason ENUM('purchase', 'deposit', 'change', 'other') NOT NULL DEFAULT 'other',
        reference VARCHAR(100) NULL,
        note VARCHAR(255) NULL,
        voided_at DATETIME NULL,
        voided_reason VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_cash_withdrawals_day (day_date),
        KEY idx_cash_withdrawals_type (movement_type),
        KEY idx_cash_withdrawals_method (payment_method),
        KEY idx_cash_withdrawals_voided (voided_at)
      ) ENGINE=InnoDB
    `,
  );
}

async function ensureCashColumns(): Promise<void> {
  if (!(await hasColumn('cash_daily_balances', 'initial_cash'))) {
    await pool.query(
      `
        ALTER TABLE cash_daily_balances
        ADD COLUMN initial_cash INT NOT NULL DEFAULT 0
      `,
    );
  }

  if (!(await hasColumn('cash_daily_balances', 'initial_card'))) {
    await pool.query(
      `
        ALTER TABLE cash_daily_balances
        ADD COLUMN initial_card INT NOT NULL DEFAULT 0
      `,
    );
  }

  if (!(await hasColumn('cash_withdrawals', 'payment_method'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD COLUMN payment_method ENUM('cash', 'card') NOT NULL DEFAULT 'cash'
      `,
    );
  }

  if (!(await hasColumn('cash_withdrawals', 'movement_type'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD COLUMN movement_type ENUM('in', 'out') NOT NULL DEFAULT 'out'
      `,
    );
  }

  if (!(await hasColumn('cash_withdrawals', 'day_date'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD COLUMN day_date DATE NOT NULL
      `,
    );
  }

  if (!(await hasColumn('cash_withdrawals', 'reason'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD COLUMN reason ENUM('purchase', 'deposit', 'change', 'other') NOT NULL DEFAULT 'other'
      `,
    );
  }

  if (!(await hasColumn('cash_withdrawals', 'reference'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD COLUMN reference VARCHAR(100) NULL
      `,
    );
  }

  if (!(await hasColumn('cash_withdrawals', 'voided_at'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD COLUMN voided_at DATETIME NULL
      `,
    );
  }

  if (!(await hasColumn('cash_withdrawals', 'voided_reason'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD COLUMN voided_reason VARCHAR(255) NULL
      `,
    );
  }
}

async function ensureCashIndexes(): Promise<void> {
  if (!(await hasIndex('cash_withdrawals', 'idx_cash_withdrawals_day'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD INDEX idx_cash_withdrawals_day (day_date)
      `,
    );
  }

  if (!(await hasIndex('cash_withdrawals', 'idx_cash_withdrawals_method'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD INDEX idx_cash_withdrawals_method (payment_method)
      `,
    );
  }

  if (!(await hasIndex('cash_withdrawals', 'idx_cash_withdrawals_type'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD INDEX idx_cash_withdrawals_type (movement_type)
      `,
    );
  }

  if (!(await hasIndex('cash_withdrawals', 'idx_cash_withdrawals_voided'))) {
    await pool.query(
      `
        ALTER TABLE cash_withdrawals
        ADD INDEX idx_cash_withdrawals_voided (voided_at)
      `,
    );
  }
}

export async function ensureAppSchema(): Promise<void> {
  await ensureSalesTables();
  await ensureSalesCompatibilityColumns();
  await ensureSalesIndexes();
  await ensureSalesForeignKeys();
  await ensureCashTables();
  await ensureCashColumns();
  await ensureCashIndexes();
}
