import { z } from 'zod';

const saleItemInputSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

const paymentMethodSchema = z.enum(['cash', 'card']);

export const createSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1),
  paymentMethod: paymentMethodSchema.default('cash'),
  soldAt: z.string().datetime().optional(),
});

export const updateSaleSchema = createSaleSchema;

export const saleItemSchema = z.object({
  productId: z.number().int().positive(),
  productCodebar: z.string().min(1),
  productName: z.string().min(1),
  brandName: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().nonnegative(),
  subtotal: z.number().int().nonnegative(),
});

export const saleSummarySchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.string().min(1),
  paymentMethod: paymentMethodSchema,
  totalAmount: z.number().int().nonnegative(),
  totalItems: z.number().int().nonnegative(),
});

export const saleDetailSchema = saleSummarySchema.extend({
  items: z.array(saleItemSchema),
});

export const saleProductSchema = z.object({
  id: z.number().int().positive(),
  codebar: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  salePrice: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
});

export type CreateSale = z.infer<typeof createSaleSchema>;
export type UpdateSale = z.infer<typeof updateSaleSchema>;
export type SaleSummary = z.infer<typeof saleSummarySchema>;
export type SaleItem = z.infer<typeof saleItemSchema>;
export type SaleDetail = z.infer<typeof saleDetailSchema>;
export type SaleProduct = z.infer<typeof saleProductSchema>;
