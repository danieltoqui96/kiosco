import type { Request, Response } from 'express';
import { ProductsModel } from './products.model.js';
import {
  createProductSchema,
  updateProductSchema,
  type CreateProduct,
  type Product,
  type UpdateProduct,
} from './products.schema.js';

export class ProductsController {
  // Obtener todos los productos
  static async getAllProducts(req: Request, res: Response) {
    try {
      const products = await ProductsModel.getAllProducts();
      res.json({
        success: true,
        data: products,
        msg: 'Productos obtenidos correctamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: 'Error al obtener los productos',
      });
    }
  }

  // Obtener producto por ID
  static async getProductById(req: Request, res: Response) {
    try {
      const productId = Number(req.params.id);
      // validar que el ID sea un número entero positivo
      if (Number.isNaN(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          msg: 'ID de producto inválido',
        });
      }

      const product = await ProductsModel.getProductById(productId);
      // validar que el producto exista
      if (!product) {
        return res.status(404).json({
          success: false,
          msg: 'Producto no encontrado',
        });
      }

      return res.json({
        success: true,
        data: product,
        msg: 'Producto obtenido correctamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: 'Error al obtener el producto',
      });
    }
  }

  // Agregar un nuevo producto
  static async addProduct(req: Request, res: Response) {
    try {
      const result = createProductSchema.safeParse(req.body);

      // validar los datos del body con Zod
      if (!result.success) {
        res.status(400).json({
          success: false,
          msg: 'Datos inválidos',
        });
        return;
      }

      const productData: CreateProduct = result.data;
      const productId = await ProductsModel.addProduct(productData);

      const newProduct = await ProductsModel.getProductById(productId);
      res.status(201).json({
        success: true,
        data: newProduct,
        msg: 'Producto agregado correctamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: 'Error al agregar el producto',
      });
    }
  }

  // Modificar un producto existente
  static async updateProduct(req: Request, res: Response) {
    try {
      const productId = Number(req.params.id);
      // validar que el ID sea un número entero positivo
      if (Number.isNaN(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          msg: 'ID de producto inválido',
        });
      }

      const parseResult = updateProductSchema.safeParse(req.body);
      // validar los datos del body con Zod
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          msg: 'Datos inválidos',
        });
      }

      const productData: UpdateProduct = parseResult.data;
      // validar que se envíe al menos un campo para actualizar
      if (Object.keys(productData).length === 0) {
        return res.status(400).json({
          success: false,
          msg: 'Debe enviar al menos un campo para actualizar',
        });
      }

      const result = await ProductsModel.updateProduct(productId, productData);

      if (!result) {
        return res.status(404).json({
          success: false,
          msg: 'Producto no encontrado',
        });
      }

      const updatedProduct = await ProductsModel.getProductById(productId);

      return res.json({
        success: true,
        data: updatedProduct,
        msg: 'Producto modificado correctamente',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: 'Error al modificar el producto',
      });
    }
  }

  // Eliminar un producto
  static async deleteProduct(req: Request, res: Response) {
    try {
      const productId = Number(req.params.id);
      // validar que el ID sea un número entero positivo
      if (Number.isNaN(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          msg: 'ID de producto inválido',
        });
      }

      const result = await ProductsModel.deleteProduct(productId);

      const msg = result
        ? 'Producto eliminado correctamente'
        : 'Producto no encontrado';
      const statusCode = result ? 200 : 404;
      res.status(statusCode).json({
        success: result,
        msg: msg,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        msg: 'Error al eliminar el producto',
      });
    }
  }
}
