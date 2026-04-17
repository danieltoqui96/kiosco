import 'express';

declare global {
  namespace Express {
    interface Response {
      success: (data: unknown, msg?: string, statusCode?: number) => Response;

      error: (msg?: string, statusCode?: number, data?: unknown) => Response;
    }
  }
}
