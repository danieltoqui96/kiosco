import { z } from 'zod';

const uppercaseTextSchema = z
  .string()
  .min(1)
  .transform((value) => value.trim().toUpperCase());

const baseCreateProductSchema = z.object({
  codebar: z.string().min(1),
  name: uppercaseTextSchema,
  brand: uppercaseTextSchema.pipe(z.string().max(100)),
  category: uppercaseTextSchema.pipe(z.string().max(100)),
  salePrice: z.number().int().nonnegative(),
  purchasePrice: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export const productSchema = z.object({
  id: z.number().int().positive(),
  codebar: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  category: z.string().min(1),
  salePrice: z.number().int().nonnegative(),
  purchasePrice: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean(),
});
export const createProductSchema = baseCreateProductSchema;
export const updateProductSchema = baseCreateProductSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.input<typeof updateProductSchema>;
