import { z } from 'zod';

const baseProductSchema = z.object({
  codebar: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  salePrice: z.number().positive(),
  purchasePrice: z.number().positive(),
  stock: z.number().int().nonnegative(),
  status: z.boolean(),
});

export const productSchema = baseProductSchema.extend({
  id: z.number().int().positive(),
});
export const createProductSchema = baseProductSchema;
export const updateProductSchema = baseProductSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.input<typeof updateProductSchema>;
