import { Router } from 'express';
import { ProductsController } from './products.controller.js';

export const productsRouter = Router();

productsRouter.get('/', ProductsController.getAllProducts);
productsRouter.get('/codebar/:codebar', ProductsController.getProductByCodebar);
productsRouter.get('/:id', ProductsController.getProductById);
productsRouter.post('/', ProductsController.addProduct);
productsRouter.put('/:id', ProductsController.updateProduct);
productsRouter.delete('/:id', ProductsController.deleteProduct);
