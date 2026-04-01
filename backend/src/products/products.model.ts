import type { ResultSetHeader } from 'mysql2';
import { pool } from '../db/mysql.js';
import {
  mapProductDBToProduct,
  mapProductToProductDB,
} from '../utils/product.mapper.js';
import type {
  CreateProduct,
  Product,
  UpdateProduct,
} from './products.schema.js';
import type { ProductDB } from './products.types.js';
import { removeUndefined } from '../utils/object.utils.js';

export class ProductsModel {
  // Obtener todos los productos
  static async getAllProducts(): Promise<Product[]> {
    // obtenemos todos los productos de la base de datos y los retornamos mapeados al formato de la aplicación
    const [productRows] = await pool.query<ProductDB[]>(
      'SELECT * FROM products',
    );
    return productRows.map(mapProductDBToProduct);
  }

  // Obtener producto por ID
  static async getProductById(id: number): Promise<Product | null> {
    // obtenemos el producto de la base de datos por su ID
    const [productRows] = await pool.query<ProductDB[]>(
      'SELECT * FROM products WHERE id = ?',
      [id],
    );

    // obtenemos el producto y lo retornamos mapeado al formato de la aplicación
    const productRow = productRows[0];
    if (!productRow || productRow.length === 0) return null;
    return mapProductDBToProduct(productRow);
  }

  // Agregar un nuevo producto
  static async addProduct(data: CreateProduct): Promise<Product | null> {
    // ajustamos el objeto para que solo incluya las propiedades definidas
    const mapData = mapProductToProductDB(data);

    console.log({ mapData });
    // insertamos el producto en la base de datos
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO products SET ?`,
      [mapData],
    );

    console.log({ result });

    // obtenemos el producto insertado por su ID y lo retornamos
    const product = await this.getProductById(result.insertId);
    if (!product) return null;
    return product;
  }

  // Modificar un producto existente
  static async updateProduct(
    id: number,
    data: UpdateProduct,
  ): Promise<Product | null> {
    // ajustamos el objeto para que solo incluya las propiedades definidas
    const mapData = mapProductToProductDB(data);
    const cleanData = removeUndefined(mapData);

    // actualizamos el producto en la base de datos
    const [result] = await pool.query<ResultSetHeader>(
      'UPDATE products SET ? WHERE id = ?',
      [cleanData, id],
    );
    if (result.affectedRows === 0) return null;

    // obtenemos el producto actualizado por su ID y lo retornamos
    const product = await this.getProductById(id);
    if (!product) return null;
    return product!;
  }

  // Eliminar un producto
  static async deleteProduct(id: number): Promise<Product | null> {
    // obtenemos el producto antes de eliminarlo para poder retornarlo después
    const product = await this.getProductById(id);
    if (!product) return null;

    // eliminamos el producto de la base de datos y retornamos el producto eliminado
    const [result] = await pool.query<ResultSetHeader>(
      'DELETE FROM products WHERE id = ?',
      [id],
    );
    if (result.affectedRows === 0) return null;
    return product;
  }
}

// tareas
// - obtener productos por codebar
// - obtener productos por categoría
// - obtener productos por marca
