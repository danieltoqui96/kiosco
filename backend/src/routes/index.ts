import type { Express } from 'express';
import { brandsRouter } from '../brands/brands.router.js';
import { categoriesRouter } from '../categories/categories.router.js';
import { productsRouter } from '../products/products.router.js';

export function registerRoutes(app: Express) {
  app.use('/brands', brandsRouter);
  app.use('/categories', categoriesRouter);
  app.use('/products', productsRouter);
}
