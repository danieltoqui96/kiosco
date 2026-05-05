import { z } from 'zod';

export const paymentMethodSchema = z.enum(['cash', 'card']);

export const saleItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1),
  paymentMethod: paymentMethodSchema.optional(),
  soldAt: z.string().datetime().optional(),
});

export const updateSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1),
  soldAt: z.string().datetime().optional(),
  paymentMethod: paymentMethodSchema.optional(),
});

export const updateCashboxSchema = z.object({
  cash: z.number().int().nonnegative(),
  card: z.number().int().nonnegative(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type UpdateCashboxInput = z.infer<typeof updateCashboxSchema>;
