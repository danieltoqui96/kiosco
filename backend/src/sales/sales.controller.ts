import type { Request, Response } from 'express';
import { createSaleSchema } from './sales.schema.js';
import { SalesModel } from './sales.model.js';
import {
  getErrorData,
  getStatusCode,
} from '../utils/controller-error.utils.js';
import {
  getPaginationParams,
  getQueryString,
} from '../utils/pagination.utils.js';

export class SalesController {
  static async getAllSales(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query.page, req.query.limit);
      const search = getQueryString(req.query.q) ?? getQueryString(req.query.search);
      const sales = await SalesModel.getAllSales(pagination, search);
      return res.success(sales, 'Ventas obtenidas con exito', 200);
    } catch (error) {
      return res.error('Error al obtener las ventas', 500, getErrorData(error));
    }
  }

  static async getSaleById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.error('ID de venta invalido', 400);
      }

      const sale = await SalesModel.getSaleById(id);
      if (!sale) return res.error('Venta no encontrada', 404);

      return res.success(sale, 'Venta obtenida correctamente', 200);
    } catch (error) {
      return res.error('Error al obtener la venta', 500, getErrorData(error));
    }
  }

  static async getSaleProducts(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query.page, req.query.limit);
      const search = getQueryString(req.query.q) ?? getQueryString(req.query.search);
      const products = await SalesModel.getSaleProducts(pagination, search);
      return res.success(products, 'Productos de venta obtenidos con exito', 200);
    } catch (error) {
      return res.error(
        'Error al obtener productos de venta',
        500,
        getErrorData(error),
      );
    }
  }

  static async addSale(req: Request, res: Response) {
    try {
      const parsed = createSaleSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      const sale = await SalesModel.addSale(parsed.data);
      return res.success(sale, 'Venta registrada correctamente', 201);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al registrar la venta', 500, getErrorData(error));
    }
  }
}
