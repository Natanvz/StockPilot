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

/** How the product list is sorted (ADR 0015). */
export type SortKey = 'newest' | 'name' | 'priceLow' | 'priceHigh';

/** Status filter for the list — `all` means no status constraint. */
export type StatusFilter = 'all' | ProductStatus;

/**
 * Cursor for list pagination: the last item's sort-field value plus its id. The
 * value is interpreted per sort (ISO date for `newest`, string for `name`, cents
 * for price) when building `startAfter`.
 */
export type ProductCursor = { value: string | number; id: string };

/** One page of products plus the cursor for the next page (null when last). */
export type ProductPage = { products: Product[]; nextCursor: ProductCursor | null };

/** The list API response: a page plus the total count for the current filter. */
export type ProductListResult = ProductPage & { total: number };

/** The query inputs that define a list request. */
export type ProductListParams = {
  status: StatusFilter;
  sort: SortKey;
  limit: number;
  cursor: ProductCursor | null;
};

/** Catalog-wide metrics for the dashboard. */
export type ProductStats = { total: number; activeCount: number; activeValueCents: number };
