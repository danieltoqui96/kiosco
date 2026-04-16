import { Router } from 'express';
import { CategoriesController } from './categories.controller.js';

export const categoriesRouter = Router();

categoriesRouter.get('/', CategoriesController.getAllCategories);
categoriesRouter.get('/name/:name', CategoriesController.getCategoryByNameExact);
categoriesRouter.get('/:id', CategoriesController.getCategoryById);
categoriesRouter.post('/', CategoriesController.addCategory);
categoriesRouter.put('/:id', CategoriesController.updateCategory);
categoriesRouter.delete('/:id', CategoriesController.deleteCategory);
