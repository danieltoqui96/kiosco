import { z } from 'zod';

export const saleItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
