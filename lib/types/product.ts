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

/** Opaque-ish cursor for list pagination: the last item's sort keys. */
export type ProductCursor = { createdAt: string; id: string };

/** One page of products plus the cursor for the next page (null when last). */
export type ProductPage = { products: Product[]; nextCursor: ProductCursor | null };

/** Catalog-wide metrics for the dashboard. */
export type ProductStats = { total: number; activeCount: number; activeValueCents: number };
