import { z } from 'zod';

export const PRODUCT_STATUSES = ['active', 'inactive'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

/** Named status values, to avoid bare 'active'/'inactive' literals in logic. */
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const satisfies Record<string, ProductStatus>;

/**
 * Product input schema (ADR 0013 — one schema validates the client form and the
 * server request body). `price` is an integer in cents (database-schema.md).
 * `categoryId` references a category document (ADR 0016); the server resolves and
 * stores the category name, so the client never sends it.
 */
export const createProductSchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryId: z.string().trim().min(1),
  price: z.number().int().nonnegative(),
  status: z.enum(PRODUCT_STATUSES),
});

/** Partial for updates — any subset of fields, but at least one. */
export const updateProductSchema = createProductSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field is required' });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
