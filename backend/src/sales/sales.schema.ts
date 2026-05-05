import { z } from 'zod';

export const saleItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1),
});

export const updateSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1),
  soldAt: z.string().datetime().optional(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
