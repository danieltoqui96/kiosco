import { createPool } from 'mysql2/promise.js';
import type { Product } from './products.types.js';
import 'dotenv/config';

const config = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || '',
  port: Number(process.env.MYSQL_PORT) || 3306,
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'kiosco',
};

console.log(config);

const pool = createPool(config);

export class ProductsModel {
  // Obtener todos los productos
  static async getAllProducts(): Promise<Product[]> {
    const [products] = await pool.query('SELECT * FROM products');
    return products as Product[];
  }

  // Obtener producto por ID
  static async getProductById(id: number): Promise<Product> {
    const [product] = await pool.query('SELECT * FROM products WHERE id = ?', [
      id,
    ]);
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    return product as unknown as Product;
  }

  // Agregar un nuevo producto
  static async addProduct(newProduct: Product): Promise<void> {
    const { barcode, name, brand, category, salePrice, purchasePrice, stock } =
      newProduct;
    await pool.query(
      'INSERT INTO products (barcode, name, brand, category, sale_price, purchase_price, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [barcode, name, brand, category, salePrice, purchasePrice, stock],
    );
    return;
  }

  // Modificar un producto existente
  static async updateProduct(
    id: number,
    updatedProduct: Partial<Omit<Product, 'id'>>,
  ): Promise<void> {
    await pool.query('UPDATE products SET ? WHERE id = ?', [
      updatedProduct,
      id,
    ]);
    return;
  }

  // Eliminar un producto
  static async deleteProduct(id: number): Promise<void> {
    await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return;
  }
}

// tareas
// - obtener productos por categoría
// - obtener productos por marca
