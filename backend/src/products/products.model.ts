import { pool } from '../db/mysql.js';
import type { ResultSetHeader } from 'mysql2';
import { BrandsModel } from '../brands/brands.model.js';
import { CategoriesModel } from '../categories/categories.model.js';
import type {
  CreateProduct,
  Product,
  UpdateProduct,
} from './products.schema.js';
import type { ProductReadDB } from './products.types.js';
import { removeUndefined } from '../utils/object.utils.js';
import {
  mapProductDBToProduct,
  mapProductToProductDB,
} from '../utils/product.mapper.js';

export class ProductsModel {
  static async getAllProducts(): Promise<Product[]> {
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
      `,
    );
    return productRows.map(mapProductDBToProduct);
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
