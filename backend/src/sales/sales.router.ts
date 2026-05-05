import { Router } from 'express';
import { SalesController } from './sales.controller.js';

export const salesRouter = Router();

salesRouter.get('/products', SalesController.getSaleProducts);
salesRouter.get('/:id', SalesController.getSaleById);
salesRouter.post('/', SalesController.createSale);
