import { z } from 'zod';

const baseProductSchema = z.object({
  codebar: z.string().min(1),
  name: z.string().min(1),
  brandId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  salePrice: z.number().int().nonnegative(),
  purchasePrice: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export const productSchema = baseProductSchema.extend({
  id: z.number().int().positive(),
});
export const createProductSchema = baseProductSchema;
export const updateProductSchema = baseProductSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.input<typeof updateProductSchema>;
