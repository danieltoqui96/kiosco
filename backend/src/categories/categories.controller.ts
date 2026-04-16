import type { Request, Response } from 'express';
import { sendResponse } from '../utils/responses.js';
import { CategoriesModel } from './categories.model.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from './categories.schema.js';

export class CategoriesController {
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

  static async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await CategoriesModel.getAllCategories();
      sendResponse(res, true, 200, categories, 'Categorias obtenidas con exito');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener categorias');
    }
  }

  static async getCategoryById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return sendResponse(res, false, 400, null, 'ID de categoria invalido');
      }

      const category = await CategoriesModel.getCategoryById(id);
      if (!category) {
        return sendResponse(res, false, 404, null, 'Categoria no encontrada');
      }

      sendResponse(res, true, 200, category, 'Categoria obtenida correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al obtener categoria');
    }
  }

  static async getCategoryByNameExact(req: Request, res: Response) {
    try {
      const nameParam = req.params.name;
      const name = Array.isArray(nameParam) ? nameParam[0] : nameParam;
      const normalizedName = name?.trim();
      if (!normalizedName) {
        return sendResponse(res, false, 400, null, 'Nombre de categoria invalido');
      }

      const category = await CategoriesModel.getCategoryByNameExact(normalizedName);
      sendResponse(res, true, 200, category, 'Categoria obtenida correctamente');
    } catch (error) {
      return this.handleError(res, error, 'Error al buscar categoria por nombre');
    }
  }

  static async addCategory(req: Request, res: Response) {
    try {
      const parsed = createCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendResponse(res, false, 400, parsed.error.issues, 'Datos invalidos');
      }

      const category = await CategoriesModel.addCategory(parsed.data);
      if (!category) {
        return sendResponse(res, false, 500, null, 'No se pudo crear la categoria');
      }

      sendResponse(res, true, 201, category, 'Categoria creada correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al crear categoria');
    }
  }

  static async updateCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return sendResponse(res, false, 400, null, 'ID de categoria invalido');
      }

      const parsed = updateCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendResponse(res, false, 400, parsed.error.issues, 'Datos invalidos');
      }

      if (Object.keys(parsed.data).length === 0) {
        return sendResponse(res, false, 400, null, 'Enviar al menos un campo valido');
      }

      const category = await CategoriesModel.updateCategory(id, parsed.data);
      if (!category) {
        return sendResponse(res, false, 404, null, 'Categoria no encontrada');
      }

      sendResponse(res, true, 200, category, 'Categoria actualizada correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al actualizar categoria');
    }
  }

  static async deleteCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id) || id <= 0) {
        return sendResponse(res, false, 400, null, 'ID de categoria invalido');
      }

      const category = await CategoriesModel.deleteCategory(id);
      if (!category) {
        return sendResponse(res, false, 404, null, 'Categoria no encontrada');
      }

      sendResponse(res, true, 200, category, 'Categoria eliminada correctamente');
    } catch (error) {
      sendResponse(res, false, 500, null, 'Error al eliminar categoria');
    }
  }
}
