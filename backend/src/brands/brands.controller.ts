import type { Request, Response } from 'express';
import { BrandsModel } from './brands.model.js';
import { createBrandSchema, updateBrandSchema } from './brands.schema.js';

function getStatusCode(error: unknown): number | null {
  if (
    typeof error === 'object' &&
    error !== null &&
    'statusCode' in error &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return null;
}

export class BrandsController {
  static async getAllBrands(req: Request, res: Response) {
    try {
      const brands = await BrandsModel.getAllBrands();
      return res.success(brands, 'Marcas obtenidas con exito', 200);
    } catch (error) {
      return res.error('Error al obtener marcas', 500);
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
      return res.error('Error al obtener marca', 500);
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
        return res.error(String((error as { message?: string }).message), statusCode);
      }
      return res.error('Error al crear marca', 500);
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
      return res.error('Error al actualizar marca', 500);
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
      return res.error('Error al eliminar marca', 500);
    }
  }
}
