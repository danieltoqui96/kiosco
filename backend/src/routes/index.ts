import type { Express } from 'express';
import { brandsRouter } from '../brands/brands.router.js';
import { cashRouter } from '../cash/cash.router.js';
import { categoriesRouter } from '../categories/categories.router.js';
import { productsRouter } from '../products/products.router.js';
import { salesRouter } from '../sales/sales.router.js';

export function registerRoutes(app: Express) {
  app.use('/brands', brandsRouter);
  app.use('/categories', categoriesRouter);
  app.use('/products', productsRouter);
  app.use('/sales', salesRouter);
  app.use('/cash', cashRouter);
}
