import type { Request, Response } from 'express';
import { CategoriesModel } from './categories.model.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './categories.schema.js';

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

export class CategoriesController {
  static async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await CategoriesModel.getAllCategories();
      return res.success(categories, 'Categorias obtenidas con exito', 200);
    } catch (error) {
      return res.error('Error al obtener categorias', 500);
    }
  }

  static async getCategoryById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return res.error('ID de categoria invalido', 400);

      const category = await CategoriesModel.getCategoryById(id);
      if (!category) return res.error('Categoria no encontrada', 404);

      return res.success(category, 'Categoria obtenida correctamente', 200);
    } catch (error) {
      return res.error('Error al obtener categoria', 500);
    }
  }

  static async addCategory(req: Request, res: Response) {
    try {
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      const category = await CategoriesModel.addCategory(parsed.data);
      return res.success(category, 'Categoria creada correctamente', 201);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(String((error as { message?: string }).message), statusCode);
      }
      return res.error('Error al crear categoria', 500);
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return res.error('ID de categoria invalido', 400);

      const parsed = updateCategorySchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      if (Object.keys(parsed.data).length === 0)
        return res.error('Enviar al menos un campo valido', 400);

      const category = await CategoriesModel.updateCategory(id, parsed.data);
      if (!category) return res.error('Categoria no encontrada', 404);

      return res.success(category, 'Categoria actualizada correctamente', 200);
    } catch (error) {
      return res.error('Error al actualizar categoria', 500);
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0)
        return res.error('ID de categoria invalido', 400);

      const category = await CategoriesModel.deleteCategory(id);
      if (!category) return res.error('Categoria no encontrada', 404);

      return res.success(category, 'Categoria eliminada correctamente', 200);
    } catch (error) {
      return res.error('Error al eliminar categoria', 500);
    }
  }
}
