import { z } from 'zod';

const uppercaseTextSchema = z
  .string()
  .min(1)
  .transform((value) => value.trim().toUpperCase());

const optionalDateSchema = z.preprocess(
  (value) => {
    if (value === '' || value === null || value === undefined) return null;
    return value;
  },
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
);

const baseCreateProductSchema = z.object({
  codebar: z.string().min(1),
  name: uppercaseTextSchema,
  brand: uppercaseTextSchema.pipe(z.string().max(100)),
  category: uppercaseTextSchema.pipe(z.string().max(100)),
  salePrice: z.number().int().nonnegative(),
  purchasePrice: z.number().int().nonnegative(),
  stock: z.number().int().nonnegative(),
  isActive: z.boolean(),
  expirationDate: optionalDateSchema.optional(),
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
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
export const createProductSchema = baseCreateProductSchema;
export const updateProductSchema = baseCreateProductSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.input<typeof updateProductSchema>;
