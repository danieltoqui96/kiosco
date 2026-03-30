import express from 'express';
import { productsRouter } from './api/products/products.router.js';
import { readJSON } from './utils/json.js';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'server running',
    timestamp: new Date().toISOString(),
    products: products,
  });
});

app.use('/products', productsRouter);

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => console.log(`server http://localhost:${PORT}`));
