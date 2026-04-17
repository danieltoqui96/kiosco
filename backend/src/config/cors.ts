import type { CorsOptions } from 'cors';
import { CORS_ORIGINS } from './env.js';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || CORS_ORIGINS.length === 0) {
      return callback(null, true);
    }

    if (CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
};
