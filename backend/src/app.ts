import express from 'express';
import cors from 'cors';
import { brandsRouter } from './brands/brands.router.js';
import { categoriesRouter } from './categories/categories.router.js';
import { responseMiddleware } from './middlewares/response.middleware.js';
import { productsRouter } from './products/products.router.js';

const app = express();
const corsOrigins = (process.env.CORS_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsOrigins.length === 0) {
      return callback(null, true);
    }

    if (corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS'));
  },
};

app.use(express.json());
app.use(cors(corsOptions));
app.use(responseMiddleware);
app.use('/brands', brandsRouter);
app.use('/categories', categoriesRouter);
app.use('/products', productsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
