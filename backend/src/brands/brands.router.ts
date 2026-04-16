import { Router } from 'express';
import { BrandsController } from './brands.controller.js';

export const brandsRouter = Router();

brandsRouter.get('/', BrandsController.getAllBrands);
brandsRouter.get('/name/:name', BrandsController.getBrandByNameExact);
brandsRouter.get('/:id', BrandsController.getBrandById);
brandsRouter.post('/', BrandsController.addBrand);
brandsRouter.put('/:id', BrandsController.updateBrand);
brandsRouter.delete('/:id', BrandsController.deleteBrand);
