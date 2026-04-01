import type { Request, Response } from 'express';
import { ProductsModel } from './products.model.js';
import { createProductSchema, updateProductSchema } from './products.schema.js';
import { sendResponse } from '../utils/responses.js';

export class ProductsController {
  // Obtener todos los productos
  static async getAllProducts(req: Request, res: Response) {
    try {
      const products = await ProductsModel.getAllProducts();
      sendResponse(res, true, 200, products, 'Productos obtenidos con exito');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener los productos');
    }
  }

  // Obtener producto por ID
  static async getProductById(req: Request, res: Response) {
    try {
      // validar que el ID sea un número entero positivo
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return sendResponse(res, false, 400, null, 'ID de producto inválido');

      // obtenemos el producto por su ID y lo retornamos
      const product = await ProductsModel.getProductById(id);
      if (!product)
        return sendResponse(res, false, 404, null, 'Producto no encontrado');

      sendResponse(res, true, 200, product, 'Producto obtenido correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener el producto');
    }
  }

  // Agregar un nuevo producto
  static async addProduct(req: Request, res: Response) {
    try {
      // validar los datos del body con Zod
      const z = createProductSchema.safeParse(req.body);
      if (!z.success)
        return sendResponse(
          res,
          false,
          400,
          z.error.format(),
          'Datos inválidos',
        );

      // agregamos el producto a la base de datos y lo retornamos
      const product = await ProductsModel.addProduct(z.data);
      if (!product)
        return sendResponse(res, false, 500, null, 'Producto no encontrado');

      sendResponse(res, true, 201, product, 'Producto agregado correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al agregar el producto');
    }
  }

  // Modificar un producto existente
  static async updateProduct(req: Request, res: Response) {
    try {
      // validar que el ID sea un número entero positivo
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return sendResponse(res, false, 400, null, 'ID de producto inválido');

      // validamos los datos del body con Zod
      const z = updateProductSchema.safeParse(req.body);
      if (!z.success)
        return sendResponse(
          res,
          false,
          400,
          z.error.format(),
          'Datos inválidos',
        );

      // validamos que se haya enviado al menos un campo para actualizar
      if (Object.keys(z.data).length === 0)
        return sendResponse(
          res,
          false,
          400,
          null,
          'enviar al menos un campo valido',
        );

      // modificamos el producto en la base de datos y lo retornamos
      const product = await ProductsModel.updateProduct(id, z.data);
      if (!product)
        return sendResponse(res, false, 404, null, 'Producto no encontrado');

      sendResponse(res, true, 200, product, 'Producto modificado con éxito');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al modificar el producto');
    }
  }

  // Eliminar un producto
  static async deleteProduct(req: Request, res: Response) {
    try {
      // validamos que el ID sea un número entero positivo
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return sendResponse(res, false, 400, null, 'ID de producto inválido');
      }

      // obtenemos el producto eliminado por su ID y lo retornamos
      const product = await ProductsModel.deleteProduct(id);
      if (!product) {
        return sendResponse(res, false, 404, null, 'Producto no encontrado');
      }

      sendResponse(res, true, 200, product, 'Producto eliminado correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al eliminar el producto');
    }
  }
}
