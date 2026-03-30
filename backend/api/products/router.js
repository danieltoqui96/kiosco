import { Router } from 'express';

export const productsRouter = Router();

productsRouter.get('/', (req, res) => {
  res.json({
    status: 'products GET',
    timestamp: new Date().toISOString(),
  });
});

productsRouter.get('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'products GET by ID',
    id: id,
    timestamp: new Date().toISOString(),
  });
});

productsRouter.post('/', (req, res) => {
  res.json({
    status: 'product CREATE',
    data: req.body,
    timestamp: new Date().toISOString(),
  });
});

productsRouter.patch('/', (req, res) => {
  res.json({
    status: 'product PATCH',
    data: req.body,
    timestamp: new Date().toISOString(),
  });
});

productsRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    status: 'product DELETE',
    id,
    timestamp: new Date().toISOString(),
  });
});
