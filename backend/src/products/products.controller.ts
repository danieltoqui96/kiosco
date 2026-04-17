import type { Request, Response } from 'express';
import { sendResponse } from '../utils/responses.js';
import { createProductSchema, updateProductSchema } from './products.schema.js';
import { ProductsModel } from './products.model.js';

export class ProductsController {
  static async getAllProducts(req: Request, res: Response) {
    try {
      const products = await ProductsModel.getAllProducts();
      sendResponse(res, true, 200, products, 'Productos obtenidos con exito');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener los productos');
    }
  }

  static async getProductByCodebar(req: Request, res: Response) {
    try {
      const codebarParam = req.params.codebar;
      const codebar = Array.isArray(codebarParam)
        ? codebarParam[0]
        : codebarParam;

      if (!codebar || codebar.trim().length === 0)
        return sendResponse(res, false, 400, null, 'Codigo de barras invalido');

      const product = await ProductsModel.getProductByCodebar(codebar);
      if (!product)
        return sendResponse(res, false, 404, null, 'Producto no encontrado');

      sendResponse(res, true, 200, product, 'Producto obtenido correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener el producto');
    }
  }

  static async getProductById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return sendResponse(res, false, 400, null, 'ID de producto invalido');

      const product = await ProductsModel.getProductById(id);
      if (!product)
        return sendResponse(res, false, 404, null, 'Producto no encontrado');

      sendResponse(res, true, 200, product, 'Producto obtenido correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener el producto');
    }
  }

  static async addProduct(req: Request, res: Response) {
    try {
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success)
        return sendResponse(
          res,
          false,
          400,
          parsed.error.issues,
          'Datos invalidos',
        );

      const product = await ProductsModel.addProduct(parsed.data);
      if (!product)
        return sendResponse(
          res,
          false,
          500,
          null,
          'No se pudo crear el producto',
        );

      sendResponse(res, true, 201, product, 'Producto agregado correctamente');
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        'message' in error
      ) {
        return sendResponse(
          res,
          false,
          Number(error.statusCode),
          null,
          String(error.message),
        );
      }
      sendResponse(res, false, 500, null, 'Error al agregar el producto');
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return sendResponse(res, false, 400, null, 'ID de producto invalido');

      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success)
        return sendResponse(
          res,
          false,
          400,
          parsed.error.issues,
          'Datos invalidos',
        );

      if (Object.keys(parsed.data).length === 0)
        return sendResponse(
          res,
          false,
          400,
          null,
          'Enviar al menos un campo valido',
        );

      const product = await ProductsModel.updateProduct(id, parsed.data);
      if (!product)
        return sendResponse(res, false, 404, null, 'Producto no encontrado');

      sendResponse(res, true, 200, product, 'Producto modificado con exito');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al modificar el producto');
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return sendResponse(res, false, 400, null, 'ID de producto invalido');

      const product = await ProductsModel.deleteProduct(id);
      if (!product)
        return sendResponse(res, false, 404, null, 'Producto no encontrado');

      sendResponse(res, true, 200, product, 'Producto eliminado correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al eliminar el producto');
    }
  }
}
