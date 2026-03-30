import express from 'express';
import { productsRouter } from './products/products.router.js';

const app = express();

app.use(express.json());
app.use('/products', productsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
