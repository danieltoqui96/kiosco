import { z } from 'zod';

const baseBrandSchema = z.object({
  name: z.string().min(1).max(100),
});

export const brandSchema = baseBrandSchema.extend({
  id: z.number().int().positive(),
});

export const createBrandSchema = baseBrandSchema;
export const updateBrandSchema = baseBrandSchema.partial();

export type Brand = z.infer<typeof brandSchema>;
export type CreateBrand = z.infer<typeof createBrandSchema>;
export type UpdateBrand = z.input<typeof updateBrandSchema>;
