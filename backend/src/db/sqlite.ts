import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface ResultSetHeader {
  affectedRows: number;
  insertId: number;
}

export interface RowDataPacket {
  [column: string]: unknown;
}

type QueryParams = unknown[] | Record<string, unknown>;

function getDatabasePath(): string {
  if (process.env.SQLITE_DATABASE_PATH) return process.env.SQLITE_DATABASE_PATH;

  const dataDir = process.env.KIOSCO_DATA_DIR ?? join(process.cwd(), 'data');
  return join(dataDir, 'kiosco.sqlite');
}

function normalizeParam(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

function normalizeParams(params: QueryParams = []): QueryParams {
  if (Array.isArray(params)) return params.map(normalizeParam);

  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, normalizeParam(value)]),
  );
}

function isReadQuery(sql: string): boolean {
  return /^(SELECT|WITH|PRAGMA)\b/i.test(sql.trim());
}

const databasePath = getDatabasePath();
mkdirSync(dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec('PRAGMA foreign_keys = ON');
database.exec('PRAGMA journal_mode = WAL');

class SqliteConnection {
  async query<T = RowDataPacket[]>(
    sql: string,
    params: QueryParams = [],
  ): Promise<[T, unknown]> {
    const statement = database.prepare(sql);
    const normalizedParams = normalizeParams(params);

    if (isReadQuery(sql)) {
      const rows = Array.isArray(normalizedParams)
        ? statement.all(...(normalizedParams as never[]))
        : statement.all(normalizedParams as never);
      return [rows as T, undefined];
    }

    const result = Array.isArray(normalizedParams)
      ? statement.run(...(normalizedParams as never[]))
      : statement.run(normalizedParams as never);
    const header: ResultSetHeader = {
      affectedRows: Number(result.changes),
      insertId: Number(result.lastInsertRowid ?? 0),
    };

    return [header as T, undefined];
  }

  async beginTransaction(): Promise<void> {
    database.exec('BEGIN IMMEDIATE');
  }

  async commit(): Promise<void> {
    database.exec('COMMIT');
  }

  async rollback(): Promise<void> {
    database.exec('ROLLBACK');
  }

  release(): void {
    // The app uses a single embedded database connection.
  }
}

const connection = new SqliteConnection();

export const pool = {
  query: connection.query.bind(connection),
  async getConnection(): Promise<SqliteConnection> {
    return connection;
  },
};

export type PoolConnection = SqliteConnection;
