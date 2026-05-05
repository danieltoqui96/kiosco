import type { Request, Response } from 'express';
import { getErrorData } from '../utils/controller-error.utils.js';
import { getQueryString } from '../utils/pagination.utils.js';
import { FinanceModel } from './finance.model.js';

function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export class FinanceController {
  static async getDailySummary(req: Request, res: Response) {
    try {
      const from = getQueryString(req.query.from);
      const to = getQueryString(req.query.to);

      if (from && !isValidDateString(from)) {
        return res.error('Parametro "from" invalido. Formato esperado: YYYY-MM-DD', 400);
      }

      if (to && !isValidDateString(to)) {
        return res.error('Parametro "to" invalido. Formato esperado: YYYY-MM-DD', 400);
      }

      const summary = await FinanceModel.getDailySummary(from, to);
      return res.success(summary, 'Resumen diario obtenido con exito', 200);
    } catch (error) {
      return res.error(
        'Error al obtener resumen diario de finanzas',
        500,
        getErrorData(error),
      );
    }
  }

  static async getDailyDetail(req: Request, res: Response) {
    try {
      const dayParam = req.params.day;
      const day = Array.isArray(dayParam) ? dayParam[0] : dayParam;

      if (!day || !isValidDateString(day)) {
        return res.error('Fecha invalida. Formato esperado: YYYY-MM-DD', 400);
      }

      const detail = await FinanceModel.getDailyDetail(day);
      return res.success(detail, 'Detalle diario obtenido con exito', 200);
    } catch (error) {
      return res.error('Error al obtener detalle diario', 500, getErrorData(error));
    }
  }
}
