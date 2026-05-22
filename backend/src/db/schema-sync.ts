import { pool } from './sqlite.js';

export async function ensureAppSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codebar TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      brand_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      sale_price INTEGER NOT NULL,
      purchase_price INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      expiration_date TEXT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands (id) ON DELETE RESTRICT,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sold_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card')),
      items_count INTEGER NOT NULL,
      total_sale INTEGER NOT NULL,
      total_cost INTEGER NOT NULL,
      profit INTEGER NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_codebar TEXT NOT NULL,
      product_name TEXT NOT NULL,
      brand_name TEXT NOT NULL DEFAULT '',
      quantity INTEGER NOT NULL,
      unit_price INTEGER NOT NULL DEFAULT 0,
      unit_sale_price INTEGER NOT NULL,
      unit_purchase_price INTEGER NOT NULL,
      line_sale_total INTEGER NOT NULL,
      line_cost_total INTEGER NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales (id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cash_daily_balances (
      day_date TEXT PRIMARY KEY,
      initial_cash INTEGER NOT NULL DEFAULT 0,
      initial_card INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cash_withdrawals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_date TEXT NOT NULL,
      movement_type TEXT NOT NULL DEFAULT 'out' CHECK (movement_type IN ('in', 'out')),
      payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card')),
      amount INTEGER NOT NULL,
      reason TEXT NOT NULL DEFAULT 'other' CHECK (reason IN ('purchase', 'deposit', 'change', 'other')),
      reference TEXT NULL,
      note TEXT NULL,
      voided_at TEXT NULL,
      voided_reason TEXT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_products_codebar ON products (codebar)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sales_sold_at ON sales (sold_at)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items (sale_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items (product_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cash_withdrawals_day ON cash_withdrawals (day_date)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cash_withdrawals_type ON cash_withdrawals (movement_type)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cash_withdrawals_method ON cash_withdrawals (payment_method)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_cash_withdrawals_voided ON cash_withdrawals (voided_at)');
}
