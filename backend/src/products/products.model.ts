import { createPool } from 'mysql2/promise.js';
import type {
  CreateProduct,
  Product,
  UpdateProduct,
} from './products.schema.js';
import 'dotenv/config';

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || '',
  port: Number(process.env.MYSQL_PORT) || 3306,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'kiosco',
};

const pool = createPool(config);

function mapProductFromDB(row: any): Product {
  return {
    id: row.id,
    barcode: row.barcode,
    name: row.name,
    brand: row.brand,
    category: row.category,
    salePrice: row.sale_price,
    purchasePrice: row.purchase_price,
    stock: row.stock,
  };
}

export class ProductsModel {
  // Obtener todos los productos
  static async getAllProducts(): Promise<Product[]> {
    const [rows] = await pool.query('SELECT * FROM products');
    return (rows as any[]).map(mapProductFromDB);
  }

  // Obtener producto por ID
  static async getProductById(productId: number): Promise<Product | null> {
    const [rows] = (await pool.query('SELECT * FROM products WHERE id = ?', [
      productId,
    ])) as [any[], any];

    if (rows.length === 0) return null;

    return mapProductFromDB(rows[0]);
  }

  // Agregar un nuevo producto
  static async addProduct(productData: CreateProduct): Promise<number> {
    const { barcode, name, brand, category, salePrice, purchasePrice, stock } =
      productData;
    const [result] = (await pool.query(
      'INSERT INTO products (barcode, name, brand, category, sale_price, purchase_price, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [barcode, name, brand, category, salePrice, purchasePrice, stock],
    )) as any;

    return result.insertId;
  }

  // Modificar un producto existente
  static async updateProduct(
    productId: number,
    productData: UpdateProduct,
  ): Promise<boolean> {
    const { barcode, name, brand, category, salePrice, purchasePrice, stock } =
      productData;

    const dbProductData: Record<string, string | number> = {};

    if (barcode !== undefined) dbProductData.barcode = barcode;
    if (name !== undefined) dbProductData.name = name;
    if (brand !== undefined) dbProductData.brand = brand;
    if (category !== undefined) dbProductData.category = category;
    if (salePrice !== undefined) dbProductData.sale_price = salePrice;
    if (purchasePrice !== undefined)
      dbProductData.purchase_price = purchasePrice;
    if (stock !== undefined) dbProductData.stock = stock;

    const [result] = (await pool.query('UPDATE products SET ? WHERE id = ?', [
      dbProductData,
      productId,
    ])) as any;

    if (result.affectedRows === 0) return false;

    return true;
  }

  // Eliminar un producto
  static async deleteProduct(productId: number): Promise<boolean> {
    const [result] = (await pool.query('DELETE FROM products WHERE id = ?', [
      productId,
    ])) as any;
    if (result.affectedRows === 0) return false;
    else return true;
  }
}

// tareas
// validar datos que vienen del body con zod
// - obtener productos por categoría
// - obtener productos por marca
