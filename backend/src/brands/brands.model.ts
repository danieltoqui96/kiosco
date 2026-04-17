import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db/mysql.js';
import type { BrandDB } from './brands.types.js';
import type { Brand, CreateBrand, UpdateBrand } from './brands.schema.js';
import type {
  PaginatedResult,
  PaginationParams,
} from '../utils/pagination.utils.js';

interface CountRow extends RowDataPacket {
  total: number;
}

export class BrandsModel {
  static async getAllBrands(
    pagination: PaginationParams,
    search?: string,
  ): Promise<PaginatedResult<Brand>> {
    const whereSql = search ? 'WHERE name LIKE ?' : '';
    const whereParams: unknown[] = search ? [`%${search}%`] : [];

    const [countRows] = await pool.query<CountRow[]>(
      `SELECT COUNT(*) AS total FROM brands ${whereSql}`,
      whereParams,
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await pool.query<BrandDB[]>(
      `SELECT * FROM brands ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...whereParams, pagination.limit, pagination.offset],
    );

    return {
      items: rows,
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
    };
  }

  static async getBrandById(id: number): Promise<Brand | null> {
    const [rows] = await pool.query<BrandDB[]>(
      'SELECT * FROM brands WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  }

  static async addBrand(data: CreateBrand): Promise<Brand> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO brands (name) VALUES (?)',
      [data.name],
    );

    const brand = await this.getBrandById(result.insertId);
    if (!brand) {
      throw {
        message: 'Marca creada pero no se pudo recuperar',
        statusCode: 500,
      };
    }
    return brand;
  }

  static async updateBrand(
    id: number,
    data: UpdateBrand,
  ): Promise<Brand | null> {
    if (data.name === undefined) return this.getBrandById(id);

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE brands SET name = ? WHERE id = ?',
      [data.name, id],
    );
    if (result.affectedRows === 0) return null;
    return this.getBrandById(id);
  }

  static async deleteBrand(id: number): Promise<Brand | null> {
    const current = await this.getBrandById(id);
    if (!current) return null;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM brands WHERE id = ?',
      [id],
    );
    if (result.affectedRows === 0) return null;
    return current;
  }

  static async getOrCreateBrand(name: string): Promise<Brand> {
    const [rows] = await pool.query<BrandDB[]>(
      'SELECT * FROM brands WHERE name = ?',
      [name],
    );

    const data = rows[0];
    if (data)
      return {
        id: data.id,
        name: data.name,
      };

    return this.addBrand({ name });
  }
}
