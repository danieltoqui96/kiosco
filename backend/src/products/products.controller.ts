import type { Request, Response } from 'express';
import { createProductSchema, updateProductSchema } from './products.schema.js';
import { ProductsModel } from './products.model.js';
import {
  getErrorData,
  getStatusCode,
} from '../utils/controller-error.utils.js';
import {
  getPaginationParams,
  getQueryBoolean,
  getQueryNumber,
  getQueryString,
} from '../utils/pagination.utils.js';

export class ProductsController {
  static async getAllProducts(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query.page, req.query.limit);
      const filters = {
        search: getQueryString(req.query.search),
        brand: getQueryString(req.query.brand),
        category: getQueryString(req.query.category),
        isActive: getQueryBoolean(req.query.isActive),
        minSalePrice: getQueryNumber(req.query.minSalePrice),
        maxSalePrice: getQueryNumber(req.query.maxSalePrice),
        minStock: getQueryNumber(req.query.minStock),
        maxStock: getQueryNumber(req.query.maxStock),
      };
      const products = await ProductsModel.getAllProducts(pagination, filters);
      return res.success(products, 'Productos obtenidos con exito', 200);
    } catch (error) {
      return res.error('Error al obtener los productos', 500, getErrorData(error));
    }
  }

  static async getProductByCodebar(req: Request, res: Response) {
    try {
      const codebarParam = req.params.codebar;
      const codebar = Array.isArray(codebarParam) ? codebarParam[0] : codebarParam;

      if (!codebar || codebar.trim().length === 0) {
        return res.error('Codigo de barras invalido', 400);
      }

      const product = await ProductsModel.getProductByCodebar(codebar);
      if (!product) return res.error('Producto no encontrado', 404);

      return res.success(product, 'Producto obtenido correctamente', 200);
    } catch (error) {
      return res.error('Error al obtener el producto', 500, getErrorData(error));
    }
  }

  static async getProductById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return res.error('ID de producto invalido', 400);
      }

      const product = await ProductsModel.getProductById(id);
      if (!product) return res.error('Producto no encontrado', 404);

      return res.success(product, 'Producto obtenido correctamente', 200);
    } catch (error) {
      return res.error('Error al obtener el producto', 500, getErrorData(error));
    }
  }

  static async addProduct(req: Request, res: Response) {
    try {
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      const product = await ProductsModel.addProduct(parsed.data);
      if (!product) return res.error('No se pudo crear el producto', 500);

      return res.success(product, 'Producto agregado correctamente', 201);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al agregar el producto', 500, getErrorData(error));
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return res.error('ID de producto invalido', 400);
      }

      const parsed = updateProductSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      if (Object.keys(parsed.data).length === 0) {
        return res.error('Enviar al menos un campo valido', 400);
      }

      const product = await ProductsModel.updateProduct(id, parsed.data);
      if (!product) return res.error('Producto no encontrado', 404);

      return res.success(product, 'Producto modificado con exito', 200);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al modificar el producto', 500, getErrorData(error));
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return res.error('ID de producto invalido', 400);
      }

      const product = await ProductsModel.deleteProduct(id);
      if (!product) return res.error('Producto no encontrado', 404);

      return res.success(product, 'Producto eliminado correctamente', 200);
    } catch (error) {
      return res.error('Error al eliminar el producto', 500, getErrorData(error));
    }
  }
}
