import { z } from 'zod';

const baseCategorySchema = z.object({
  name: z.string().min(1).max(100),
});

export const categorySchema = baseCategorySchema.extend({
  id: z.number().int().positive(),
});

export const createCategorySchema = baseCategorySchema;
export const updateCategorySchema = baseCategorySchema.partial();

export type Category = z.infer<typeof categorySchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.input<typeof updateCategorySchema>;
