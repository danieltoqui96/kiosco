import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db/mysql.js';
import type { BrandDB } from './brands.types.js';
import type { Brand, CreateBrand, UpdateBrand } from './brands.schema.js';

export class BrandsModel {
  static async getAllBrands(): Promise<Brand[]> {
    const [rows] = await pool.query<BrandDB[]>(
      'SELECT * FROM brands ORDER BY id;',
    );
    return rows;
  }

  static async getBrandById(id: number): Promise<Brand | null> {
    const [rows] = await pool.query<BrandDB[]>(
      'SELECT * FROM brands WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  }

  static async getBrandByNameExact(name: string): Promise<Brand> {
    try {
      const [rows] = await pool.query<BrandDB[]>(
        'SELECT * FROM brands WHERE name = ?',
        [name],
      );
      const brand = rows[0] ?? null;
      if (!brand) {
        throw {
          message: 'Marca no encontrada',
          code: 404,
        };
      }
      return brand;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'message' in error
      ) {
        throw error;
      }
      throw {
        message: 'Error al buscar la marca por nombre',
        code: 500,
      };
    }
  }

  static async getOrCreateBrandByName(name: string): Promise<Brand> {
    try {
      return await this.getBrandByNameExact(name);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 404
      ) {
        const created = await this.addBrand({ name });
        if (!created) {
          throw {
            message: 'No se pudo crear la marca',
            code: 500,
          };
        }
        return created;
      }

      throw {
        message: 'Error al consultar o crear la marca',
        code: 500,
      };
    }
  }

  static async addBrand(data: CreateBrand): Promise<Brand | null> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO brands (name) VALUES (?)',
      [data.name],
    );
    return this.getBrandById(result.insertId);
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
}
