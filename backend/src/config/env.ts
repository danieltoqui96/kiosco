export const PORT = Number(process.env.PORT) || 3000;

export const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
