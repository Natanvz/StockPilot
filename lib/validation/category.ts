import { z } from 'zod';

/**
 * Category input schema (ADR 0016). One schema validates the client form and the
 * server request body, mirroring the products pattern (ADR 0013). A category is
 * just a name; ownership and timestamps are set server-side.
 */
export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(60),
});

/** Partial for updates — any subset of fields, but at least one. */
export const updateCategorySchema = createCategorySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
