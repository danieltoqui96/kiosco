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

  static async addCategory(data: CreateCategory): Promise<Category> {
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO categories (name) VALUES (?)',
      [data.name],
    );

    const category = await this.getCategoryById(result.insertId);
    if (!category) {
      throw {
        message: 'Categoría creada pero no se pudo recuperar',
        statusCode: 500,
      };
    }
    return category;
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

  static async getOrCreateCategory(name: string): Promise<Category> {
    const [rows] = await pool.query<CategoryDB[]>(
      'SELECT * FROM categories WHERE name = ?',
      [name],
    );

    const data = rows[0];
    if (data)
      return {
        id: data.id,
        name: data.name,
      };

    return this.addCategory({ name });
  }
}
