import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db/mysql.js';
import type { CategoryDB } from './categories.types.js';
import type {
  Category,
  CreateCategory,
  UpdateCategory,
} from './categories.schema.js';

export class CategoriesModel {
  static async getAllCategories(): Promise<Category[]> {
    const [rows] = await pool.query<CategoryDB[]>(
      'SELECT * FROM categories ORDER BY id',
    );
    return rows;
  }

  static async getCategoryById(id: number): Promise<Category | null> {
    const [rows] = await pool.query<CategoryDB[]>(
      'SELECT * FROM categories WHERE id = ?',
      [id],
    );
    return rows[0] ?? null;
  }

  static async getCategoryByNameExact(name: string): Promise<Category> {
    try {
      const [rows] = await pool.query<CategoryDB[]>(
        'SELECT * FROM categories WHERE name = ?',
        [name],
      );
      const category = rows[0] ?? null;
      if (!category) {
        throw {
          message: 'Categoria no encontrada',
          code: 404,
        };
      }
      return category;
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
        message: 'Error al buscar la categoria por nombre',
        code: 500,
      };
    }
  }

  static async getOrCreateCategoryByName(name: string): Promise<Category> {
    try {
      return await this.getCategoryByNameExact(name);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: number }).code === 404
      ) {
        const created = await this.addCategory({ name });
        if (!created) {
          throw {
            message: 'No se pudo crear la categoria',
            code: 500,
          };
        }
        return created;
      }

      throw {
        message: 'Error al consultar o crear la categoria',
        code: 500,
      };
    }
  }

  static async addCategory(data: CreateCategory): Promise<Category | null> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO categories (name) VALUES (?)',
      [data.name],
    );
    return this.getCategoryById(result.insertId);
  }

  static async updateCategory(
    id: number,
    data: UpdateCategory,
  ): Promise<Category | null> {
    if (data.name === undefined) return this.getCategoryById(id);

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE categories SET name = ? WHERE id = ?',
      [data.name, id],
    );
    if (result.affectedRows === 0) return null;
    return this.getCategoryById(id);
  }

  static async deleteCategory(id: number): Promise<Category | null> {
    const current = await this.getCategoryById(id);
    if (!current) return null;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM categories WHERE id = ?',
      [id],
    );
    if (result.affectedRows === 0) return null;
    return current;
  }
}
