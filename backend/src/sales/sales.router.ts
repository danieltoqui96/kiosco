import { Router } from 'express';
import { SalesController } from './sales.controller.js';

export const salesRouter = Router();

salesRouter.get('/', SalesController.getSales);
salesRouter.get('/products', SalesController.getSaleProducts);
salesRouter.get('/cashbox', SalesController.getCashboxBalances);
salesRouter.put('/cashbox', SalesController.updateCashboxBalances);
salesRouter.post('/cashbox/reset', SalesController.resetCashboxBalances);
salesRouter.get('/:id', SalesController.getSaleById);
salesRouter.post('/', SalesController.createSale);
salesRouter.put('/:id', SalesController.updateSale);
salesRouter.delete('/:id', SalesController.deleteSale);
