import type { Product } from './products.types.js';

const products: Product[] = [
  {
    id: 1,
    barcode: '7801234567890',
    name: 'Bebida Cola 500ml',
    brand: 'Coca-Cola',
    category: 'Bebidas',
    salePrice: 1200,
    purchasePrice: 800,
    stock: 20,
  },
  {
    id: 2,
    barcode: '7801234567891',
    name: 'Papas Fritas 150g',
    brand: 'Lays',
    category: 'Snacks',
    salePrice: 1800,
    purchasePrice: 1200,
    stock: 15,
  },
];

export class ProductsModel {
  // Obtener todos los productos
  static getAllProducts(): Product[] {
    return products;
  }

  // Obtener producto por ID
  static getProductById(id: number): Product {
    const product = products.find((product) => product.id === id);
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    return product;
  }

  // Agregar un nuevo producto
  static addProduct(product: Product): Product {
    // agregar un id único al producto
    product.id = products.length + 1;
    products.push(product);
    return product;
  }

  // Modificar un producto existente
  static updateProduct(
    id: number,
    updatedProduct: Partial<Omit<Product, 'id'>>,
  ): Product {
    const productIndex = products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      throw new Error('Producto no encontrado');
    }
    const newProduct = {
      ...products[productIndex],
      ...updatedProduct,
    } as Product;

    products[productIndex] = newProduct;
    return newProduct;
  }

  // Eliminar un producto
  static deleteProduct(id: number): Product {
    const productIndex = products.findIndex((product) => product.id === id);
    if (productIndex === -1) {
      throw new Error('Producto no encontrado');
    }
    const [deletedProduct] = products.splice(productIndex, 1);
    return deletedProduct!;
  }
}

// tareas
// - agregar base de datos
// - obtener productos por categoría
// - obtener productos por marca
// - implementar UUID en lugar de un id numérico
