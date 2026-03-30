import express from 'express';
import { productsRouter } from './api/products/router.js';

const app = express();

app.use(express.json());

app.use('/products', productsRouter);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => console.log(`server http://localhost:${PORT}`));
