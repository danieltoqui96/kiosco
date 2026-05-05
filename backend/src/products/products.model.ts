import { pool } from '../db/mysql.js';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { BrandsModel } from '../brands/brands.model.js';
import { CategoriesModel } from '../categories/categories.model.js';
import type {
  CreateProduct,
  Product,
  UpdateProduct,
} from './products.schema.js';
import type { ProductReadDB } from './products.types.js';
import type {
  PaginatedResult,
  PaginationParams,
} from '../utils/pagination.utils.js';
import { removeUndefined } from '../utils/object.utils.js';
import {
  mapProductDBToProduct,
  mapProductToProductDB,
} from '../utils/product.mapper.js';

interface CountRow extends RowDataPacket {
  total: number;
}

export interface ProductsFilters {
  search?: string | undefined;
  brand?: string | undefined;
  category?: string | undefined;
  isActive?: boolean | undefined;
  minSalePrice?: number | undefined;
  maxSalePrice?: number | undefined;
  minStock?: number | undefined;
  maxStock?: number | undefined;
}

export class ProductsModel {
  static async getAllProducts(
    pagination: PaginationParams,
    filters: ProductsFilters,
  ): Promise<PaginatedResult<Product>> {
    const whereClauses: string[] = [];
    const whereParams: unknown[] = [];

    if (filters.search) {
      whereClauses.push('(p.name LIKE ? OR p.codebar LIKE ?)');
      const searchValue = `%${filters.search}%`;
      whereParams.push(searchValue, searchValue);
    }

    if (filters.brand) {
      whereClauses.push('b.name = ?');
      whereParams.push(filters.brand);
    }

    if (filters.category) {
      whereClauses.push('c.name = ?');
      whereParams.push(filters.category);
    }

    if (filters.isActive !== undefined) {
      whereClauses.push('p.is_active = ?');
      whereParams.push(filters.isActive ? 1 : 0);
    }

    if (filters.minSalePrice !== undefined) {
      whereClauses.push('p.sale_price >= ?');
      whereParams.push(filters.minSalePrice);
    }

    if (filters.maxSalePrice !== undefined) {
      whereClauses.push('p.sale_price <= ?');
      whereParams.push(filters.maxSalePrice);
    }

    if (filters.minStock !== undefined) {
      whereClauses.push('p.stock >= ?');
      whereParams.push(filters.minStock);
    }

    if (filters.maxStock !== undefined) {
      whereClauses.push('p.stock <= ?');
      whereParams.push(filters.maxStock);
    }

    const whereSql =
      whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

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

    const [productRows] = await pool.query<ProductReadDB[]>(
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

    return {
      items: productRows.map(mapProductDBToProduct),
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / pagination.limit),
    };
  }

  static async getProductById(id: number): Promise<Product | null> {
    const [productRows] = await pool.query<ProductReadDB[]>(
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
        WHERE p.id = ?
      `,
      [id],
    );

    const productRow = productRows[0];
    if (!productRow) return null;
    return mapProductDBToProduct(productRow);
  }

  static async addProduct(data: CreateProduct): Promise<Product | null> {
    const brand = await BrandsModel.getOrCreateBrand(data.brand);
    const category = await CategoriesModel.getOrCreateCategory(data.category);

    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO products SET ?',
      [
        {
          codebar: data.codebar,
          name: data.name,
          brand_id: brand.id,
          category_id: category.id,
          sale_price: data.salePrice,
          purchase_price: data.purchasePrice,
          stock: data.stock,
          is_active: data.isActive,
        },
      ],
    );

    const product = await this.getProductById(result.insertId);

    if (!product) {
      throw {
        message: 'Producto creado pero no se pudo recuperar',
        statusCode: 500,
      };
    }

    return product;
  }

  static async updateProduct(
    id: number,
    data: UpdateProduct,
  ): Promise<Product | null> {
    const mapData = mapProductToProductDB(data);
    const cleanData = removeUndefined(mapData);

    if (data.brand !== undefined) {
      const brand = await BrandsModel.getOrCreateBrand(data.brand);
      cleanData.brand_id = brand.id;
    }

    if (data.category !== undefined) {
      const category = await CategoriesModel.getOrCreateCategory(data.category);
      cleanData.category_id = category.id;
    }

    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE products SET ? WHERE id = ?',
      [cleanData, id],
    );

    if (result.affectedRows === 0) return null;

    const product = await this.getProductById(id);
    if (!product) {
      throw {
        message: 'Producto actualizado pero no se pudo recuperar',
        statusCode: 500,
      };
    }
    return product;
  }

  static async deleteProduct(id: number): Promise<Product | null> {
    const product = await this.getProductById(id);
    if (!product) return null;

    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM products WHERE id = ?',
      [id],
    );
    if (result.affectedRows === 0) return null;
    return product;
  }

  static async getProductByCodebar(codebar: string): Promise<Product | null> {
    const [productRows] = await pool.query<ProductReadDB[]>(
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
        WHERE p.codebar = ?
      `,
      [codebar],
    );

    const productRow = productRows[0];
    if (!productRow) return null;
    return mapProductDBToProduct(productRow);
  }
}
