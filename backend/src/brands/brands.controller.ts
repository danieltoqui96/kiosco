import type { Request, Response } from 'express';
import {
  getErrorData,
  getStatusCode,
} from '../utils/controller-error.utils.js';
import { getPaginationParams } from '../utils/pagination.utils.js';
import { BrandsModel } from './brands.model.js';
import { createBrandSchema, updateBrandSchema } from './brands.schema.js';

export class BrandsController {
  static async getAllBrands(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query.page, req.query.limit);
      const brands = await BrandsModel.getAllBrands(pagination);
      return res.success(brands, 'Marcas obtenidas con exito', 200);
    } catch (error) {
      return res.error('Error al obtener marcas', 500, getErrorData(error));
    }
  }

  static async getBrandById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return res.error('ID de marca invalido', 400);

      const brand = await BrandsModel.getBrandById(id);
      if (!brand) return res.error('Marca no encontrada', 404);

      return res.success(brand, 'Marca obtenida correctamente', 200);
    } catch (error) {
      return res.error('Error al obtener marca', 500, getErrorData(error));
    }
  }

  static async addBrand(req: Request, res: Response) {
    try {
      const parsed = createBrandSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      const brand = await BrandsModel.addBrand(parsed.data);
      return res.success(brand, 'Marca creada correctamente', 201);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al crear marca', 500, getErrorData(error));
    }
  }

  static async updateBrand(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return res.error('ID de marca invalido', 400);

      const parsed = updateBrandSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      if (Object.keys(parsed.data).length === 0)
        return res.error('Enviar al menos un campo valido', 400);

      const brand = await BrandsModel.updateBrand(id, parsed.data);
      if (!brand) return res.error('Marca no encontrada', 404);

      return res.success(brand, 'Marca actualizada correctamente', 200);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al actualizar marca', 500, getErrorData(error));
    }
  }

  static async deleteBrand(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return res.error('ID de marca invalido', 400);

      const brand = await BrandsModel.deleteBrand(id);
      if (!brand) return res.error('Marca no encontrada', 404);

      return res.success(brand, 'Marca eliminada correctamente', 200);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al eliminar marca', 500, getErrorData(error));
    }
  }
}
