import { readJSON, writeJSON } from '../../utils/json.js';

export class ProductModel {
  // Obtener todos los productos
  static async getAll() {
    const products = await readJSON('./data/products.json');
    return products;
  }

  // Obtener producto por ID
  static async getById(id) {
    const products = await readJSON('./data/products.json');
    return products.find((product) => product.id === id);
  }

  // Agregar un nuevo producto
  static async create(product) {
    const products = await readJSON('./data/products.json');
    const newProduct = { id: products.length + 1, ...product };
    products.push(newProduct);
    await writeJSON('./data/products.json', products); //
    return newProduct;
  }
}
