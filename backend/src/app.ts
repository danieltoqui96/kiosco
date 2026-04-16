import express from 'express';
import { brandsRouter } from './brands/brands.router.js';
import { categoriesRouter } from './categories/categories.router.js';
import { productsRouter } from './products/products.router.js';

const app = express();

app.use(express.json());
app.use('/brands', brandsRouter);
app.use('/categories', categoriesRouter);
app.use('/products', productsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
