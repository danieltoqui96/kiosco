import type { Response } from 'express';

// funcion para devolver una respuesta JSON con formato estandarizado
export function sendResponse<T>(
  res: Response,
  success: boolean,
  statusCode: number,
  data: T,
  msg: string | null,
) {
  return res.status(statusCode).json({
    success,
    data,
    msg,
  });
}
