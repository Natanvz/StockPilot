import type { ProductStatus } from '@/lib/validation/product';

/** The API-facing product shape, shared by server and client (no server-only deps). */
export type Product = {
  id: string;
  name: string;
  category: string;
  /** Integer, in cents. */
  price: number;
  status: ProductStatus;
  ownerId: string;
  createdAt: string | null;
  updatedAt: string | null;
};
