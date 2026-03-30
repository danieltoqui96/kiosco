import type { Request, Response } from 'express';
import { ProductsModel } from './products.model.js';

export class ProductsController {
  // Obtener todos los productos
  static getAllProducts(req: Request, res: Response) {
    try {
      const products = ProductsModel.getAllProducts();
      res.json({
        msg: 'Productos obtenidos correctamente',
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        msg: 'Error al obtener los productos',
        error: error,
      });
    }
  }

  // Obtener producto por ID
  static getProductById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const product = ProductsModel.getProductById(id);
      res.json({
        msg: 'Producto obtenido correctamente',
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        msg: 'Error al obtener el producto',
        error: error,
      });
    }
  }

  // Agregar un nuevo producto
  static addProduct(req: Request, res: Response) {
    try {
      const product = req.body;
      const newProduct = ProductsModel.addProduct(product);
      res.status(201).json({
        msg: 'Producto agregado correctamente',
        data: newProduct,
      });
    } catch (error) {
      res.status(500).json({
        msg: 'Error al agregar el producto',
        error: error,
      });
    }
  }

  // Modificar un producto existente
  static updateProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const updatedProduct = req.body;
      const product = ProductsModel.updateProduct(id, updatedProduct);
      res.json({
        msg: 'Producto modificado correctamente',
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        msg: 'Error al modificar el producto',
        error: error,
      });
    }
  }

  // Eliminar un producto
  static deleteProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const deletedProduct = ProductsModel.deleteProduct(id);
      res.json({
        msg: 'Producto eliminado correctamente',
        data: deletedProduct,
      });
    } catch (error) {
      res.status(500).json({
        msg: 'Error al eliminar el producto',
        error: error,
      });
    }
  }
}
