import type { Request, Response } from 'express';
import {
  createCashDepositSchema,
  createCashWithdrawalSchema,
  updateCashInitialSchema,
  voidCashWithdrawalSchema,
} from './cash.schema.js';
import { CashModel } from './cash.model.js';
import { getErrorData, getStatusCode } from '../utils/controller-error.utils.js';
import {
  getPaginationParams,
  getQueryString,
} from '../utils/pagination.utils.js';

function parseDayParam(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return null;
  return normalized;
}

export class CashController {
  static async getSummaryByDay(req: Request, res: Response) {
    try {
      const pagination = getPaginationParams(req.query.page, req.query.limit);
      const from = CashModel.normalizeDateFilter(getQueryString(req.query.from));
      const to = CashModel.normalizeDateFilter(getQueryString(req.query.to));

      const summary = await CashModel.getSummaryByDay(pagination, from, to);
      return res.success(summary, 'Resumen de caja obtenido con exito', 200);
    } catch (error) {
      return res.error('Error al obtener resumen de caja', 500, getErrorData(error));
    }
  }

  static async getDayDetail(req: Request, res: Response) {
    try {
      const day = parseDayParam(req.params.day);
      if (!day) return res.error('Fecha invalida', 400);

      const detail = await CashModel.getDayDetail(day);
      return res.success(detail, 'Detalle de caja obtenido con exito', 200);
    } catch (error) {
      return res.error('Error al obtener detalle de caja', 500, getErrorData(error));
    }
  }

  static async updateInitialBalance(req: Request, res: Response) {
    try {
      const day = parseDayParam(req.params.day);
      if (!day) return res.error('Fecha invalida', 400);

      const parsed = updateCashInitialSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      const detail = await CashModel.updateInitialBalance(day, parsed.data);
      return res.success(detail, 'Monto inicial actualizado', 200);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al actualizar monto inicial', 500, getErrorData(error));
    }
  }

  static async createWithdrawal(req: Request, res: Response) {
    try {
      const day = parseDayParam(req.params.day);
      if (!day) return res.error('Fecha invalida', 400);

      const parsed = createCashWithdrawalSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);
      if (parsed.data.reason === 'deposit') {
        return res.error('Para ingresos utiliza el boton Agregar dinero.', 400);
      }

      const detail = await CashModel.createWithdrawal(day, parsed.data);
      return res.success(detail, 'Retiro registrado correctamente', 201);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al registrar retiro', 500, getErrorData(error));
    }
  }

  static async createDeposit(req: Request, res: Response) {
    try {
      const day = parseDayParam(req.params.day);
      if (!day) return res.error('Fecha invalida', 400);

      const parsed = createCashDepositSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);
      if (parsed.data.reason === 'purchase') {
        return res.error('El motivo compra corresponde a retiros, no a ingresos.', 400);
      }

      const detail = await CashModel.createDeposit(day, parsed.data);
      return res.success(detail, 'Ingreso registrado correctamente', 201);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al registrar ingreso', 500, getErrorData(error));
    }
  }

  static async voidWithdrawal(req: Request, res: Response) {
    try {
      const day = parseDayParam(req.params.day);
      if (!day) return res.error('Fecha invalida', 400);

      const withdrawalId = Number(req.params.withdrawalId);
      if (!Number.isInteger(withdrawalId) || withdrawalId <= 0) {
        return res.error('ID de retiro invalido', 400);
      }

      const parsed = voidCashWithdrawalSchema.safeParse(req.body);
      if (!parsed.success) return res.error('Datos invalidos', 400, parsed.error.issues);

      const detail = await CashModel.voidWithdrawal(day, withdrawalId, parsed.data);
      return res.success(detail, 'Movimiento anulado correctamente', 200);
    } catch (error) {
      const statusCode = getStatusCode(error);
      if (statusCode) {
        return res.error(
          String((error as { message?: string }).message),
          statusCode,
          getErrorData(error),
        );
      }
      return res.error('Error al anular movimiento', 500, getErrorData(error));
    }
  }
}
