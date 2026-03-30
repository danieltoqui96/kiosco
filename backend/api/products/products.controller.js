import { ProductModel } from './products.model.js';

export class ProductsController {
  // Obtener todos los productos
  static async getAll(req, res) {
    try {
      const products = await ProductModel.getAll();
      console.log('llamada a controller');
      res.json({
        status: 'products GET All',
        timestamp: new Date().toISOString(),
        count: products.length,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error al recuperar Productos',
        error: error,
      });
    }
  }

  // Obtener producto por ID
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const product = await ProductModel.getById(+id);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Producto no encontrado',
        });
      }
      res.json({
        status: 'product GET BY ID',
        timestamp: new Date().toISOString(),
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error al recuperar el producto',
        error: error,
      });
    }
  }

  // Agregar un nuevo producto
  static async create(req, res) {
    try {
      const result = req.body;
      const newProduct = await ProductModel.create(result);
      res.status(201).json({
        status: 'product POST',
        timestamp: new Date().toISOString(),
        data: newProduct,
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Ocurrió un error al agregar el producto',
        error: error,
      });
    }
  }
}
