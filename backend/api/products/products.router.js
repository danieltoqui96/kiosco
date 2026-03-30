import { Router } from 'express';
import { ProductsController } from './products.controller.js';

export const productsRouter = Router();

productsRouter.get('/', ProductsController.getAll);
productsRouter.get('/:id', ProductsController.getById);
productsRouter.post('/', ProductsController.create);
