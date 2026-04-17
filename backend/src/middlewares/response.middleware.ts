import type { NextFunction, Request, Response } from 'express';

export function responseMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.success = (data, msg = 'OK', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      data,
      msg,
    });
  };

  res.error = (msg = 'Error interno del servidor', statusCode = 500, data = null) => {
    return res.status(statusCode).json({
      success: false,
      data,
      msg,
    });
  };

  next();
}
