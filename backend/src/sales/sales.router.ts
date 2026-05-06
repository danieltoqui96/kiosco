import { Router } from 'express';
import { SalesController } from './sales.controller.js';

export const salesRouter = Router();

salesRouter.get('/', SalesController.getAllSales);
salesRouter.get('/products', SalesController.getSaleProducts);
salesRouter.get('/:id', SalesController.getSaleById);
salesRouter.post('/', SalesController.addSale);
salesRouter.put('/:id', SalesController.updateSale);
salesRouter.delete('/:id', SalesController.deleteSale);
