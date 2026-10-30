import type { ProductStatus } from '@/lib/validation/product';

/** The API-facing product shape, shared by server and client (no server-only deps). */
export type Product = {
  id: string;
  name: string;
  /** The category this product belongs to (ADR 0016). */
  categoryId: string;
  /** Denormalized category name, kept on the product for cheap table display. */
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

/**
 * Category filter for the list: a category id, or the literal `all` for no
 * category constraint. Real Firestore ids are never the string `all`. A named
 * alias (not bare `string`) so call sites read as "a category filter".
 */
// eslint-disable-next-line sonarjs/redundant-type-aliases -- intentional domain alias for readability
export type CategoryFilter = string;

/** The sentinel meaning "no category constraint". */
export const ALL_CATEGORIES = 'all';

/** The query inputs that define a list request. */
export type ProductListParams = {
  status: StatusFilter;
  categoryId: CategoryFilter;
  sort: SortKey;
  limit: number;
  cursor: ProductCursor | null;
};

/** Catalog-wide metrics for the dashboard. */
export type ProductStats = { total: number; activeCount: number; activeValueCents: number };

/** One page of full-text search results (Meilisearch, ADR 0018). */
export type ProductSearchResult = {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
};
