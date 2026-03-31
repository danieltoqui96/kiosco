import { z } from 'zod';

export const productSchema = z.object({
  id: z.number().int().positive(),
  barcode: z.string().min(1, 'El código de barra es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  brand: z.string().min(1, 'La marca es obligatoria'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  salePrice: z.number().positive('El precio de venta debe ser mayor a 0'),
  purchasePrice: z
    .number()
    .positive('El precio de adquisición debe ser mayor a 0'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
});

export const createProductSchema = z.object({
  barcode: z.string().min(1, 'El código de barra es obligatorio'),
  name: z.string().min(1, 'El nombre es obligatorio'),
  brand: z.string().min(1, 'La marca es obligatoria'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  salePrice: z.number().positive('El precio de venta debe ser mayor a 0'),
  purchasePrice: z
    .number()
    .positive('El precio de adquisición debe ser mayor a 0'),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
});

export const updateProductSchema = createProductSchema.partial();

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
