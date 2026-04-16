import type { Request, Response } from 'express';
import { sendResponse } from '../utils/responses.js';
import { BrandsModel } from './brands.model.js';
import { createBrandSchema, updateBrandSchema } from './brands.schema.js';

export class BrandsController {
  private static handleError(res: Response, error: unknown, fallbackMessage: string) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as { code?: unknown }).code === 'number' &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const typedError = error as { code: number; message: string };
      return sendResponse(res, false, typedError.code, null, typedError.message);
    }
    return sendResponse(res, false, 500, null, fallbackMessage);
  }

  static async getAllBrands(req: Request, res: Response) {
    try {
      const brands = await BrandsModel.getAllBrands();
      sendResponse(res, true, 200, brands, 'Marcas obtenidas con exito');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener marcas');
    }
  }

  static async getBrandById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return sendResponse(res, false, 400, null, 'ID de marca invalido');
      }

      const brand = await BrandsModel.getBrandById(id);
      if (!brand) return sendResponse(res, false, 404, null, 'Marca no encontrada');

      sendResponse(res, true, 200, brand, 'Marca obtenida correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener marca');
    }
  }

  static async getBrandByNameExact(req: Request, res: Response) {
    try {
      const nameParam = req.params.name;
      const name = Array.isArray(nameParam) ? nameParam[0] : nameParam;
      const normalizedName = name?.trim();
      if (!normalizedName) {
        return sendResponse(res, false, 400, null, 'Nombre de marca invalido');
      }

      const brand = await BrandsModel.getBrandByNameExact(normalizedName);
      sendResponse(res, true, 200, brand, 'Marca obtenida correctamente');
    } catch (error) {
      return this.handleError(res, error, 'Error al buscar marca por nombre');
    }
  }

  static async addBrand(req: Request, res: Response) {
    try {
      const parsed = createBrandSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendResponse(res, false, 400, parsed.error.issues, 'Datos invalidos');
      }

      const brand = await BrandsModel.addBrand(parsed.data);
      if (!brand) return sendResponse(res, false, 500, null, 'No se pudo crear la marca');

      sendResponse(res, true, 201, brand, 'Marca creada correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al crear marca');
    }
  }

  static async updateBrand(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return sendResponse(res, false, 400, null, 'ID de marca invalido');
      }

      const parsed = updateBrandSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendResponse(res, false, 400, parsed.error.issues, 'Datos invalidos');
      }

      if (Object.keys(parsed.data).length === 0) {
        return sendResponse(res, false, 400, null, 'Enviar al menos un campo valido');
      }

      const brand = await BrandsModel.updateBrand(id, parsed.data);
      if (!brand) return sendResponse(res, false, 404, null, 'Marca no encontrada');

      sendResponse(res, true, 200, brand, 'Marca actualizada correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al actualizar marca');
    }
  }

  static async deleteBrand(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return sendResponse(res, false, 400, null, 'ID de marca invalido');
      }

      const brand = await BrandsModel.deleteBrand(id);
      if (!brand) return sendResponse(res, false, 404, null, 'Marca no encontrada');

      sendResponse(res, true, 200, brand, 'Marca eliminada correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al eliminar marca');
    }
  }
}
