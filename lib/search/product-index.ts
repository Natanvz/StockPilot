import 'server-only';
import { Meilisearch } from 'meilisearch';
import type {
  CategoryFilter,
  Product,
  ProductSearchResult,
  StatusFilter,
} from '@/lib/types/product';

/**
 * Meilisearch product index (ADR 0018). A derived read model — Firestore stays
 * the source of truth. Every write here is **best-effort**: a Meilisearch error
 * is logged and swallowed, never thrown into the request path, so search being
 * down can't break a Firestore write. When `MEILI_HOST` is unset, search is
 * disabled and all operations are no-ops (graceful degradation).
 */

const INDEX = 'products';
const DEFAULT_HITS_PER_PAGE = 20;

/** The document shape stored in the index. `createdAtMs` exists only for sorting. */
type ProductDoc = Product & { createdAtMs: number };

export type ProductSearchParams = {
  query: string;
  status?: StatusFilter;
  categoryId?: CategoryFilter;
  page?: number;
  hitsPerPage?: number;
};

/** Search is enabled only when a Meilisearch host is configured. */
export function isSearchEnabled(): boolean {
  return (process.env.MEILI_HOST ?? '').trim().length > 0;
}

let cached: Meilisearch | null = null;
function client(): Meilisearch | null {
  if (!isSearchEnabled()) return null;
  if (!cached) {
    const apiKey = process.env.MEILI_API_KEY ?? '';
    cached = new Meilisearch({ host: process.env.MEILI_HOST ?? '', apiKey: apiKey || undefined });
  }
  return cached;
}

/** Run a Meilisearch op, logging and swallowing any error (best-effort sync). */
async function safe<T>(label: string, fn: (ms: Meilisearch) => Promise<T>): Promise<T | null> {
  const ms = client();
  if (!ms) return null;
  try {
    return await fn(ms);
  } catch (error) {
    console.error(`[search] ${label} failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

function toDoc(product: Product): ProductDoc {
  return { ...product, createdAtMs: product.createdAt ? Date.parse(product.createdAt) : 0 };
}

function fromDoc(doc: ProductDoc): Product {
  return {
    id: doc.id,
    name: doc.name,
    categoryId: doc.categoryId,
    category: doc.category,
    price: doc.price,
    status: doc.status,
    ownerId: doc.ownerId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Create the index and set searchable/filterable/sortable attributes (idempotent). */
export async function ensureProductIndex(): Promise<void> {
  await safe('ensureIndex', async (ms) => {
    await ms.createIndex(INDEX, { primaryKey: 'id' }).catch(() => undefined); // already exists → ignore
    await ms.index(INDEX).updateSettings({
      searchableAttributes: ['name', 'category'],
      filterableAttributes: ['status', 'categoryId'],
      sortableAttributes: ['createdAtMs', 'price'],
    });
  });
}

export async function indexProduct(product: Product): Promise<void> {
  await safe('indexProduct', (ms) =>
    ms.index(INDEX).addDocuments([toDoc(product)], { primaryKey: 'id' }),
  );
}

export async function indexProducts(products: Product[]): Promise<void> {
  if (products.length === 0) return;
  await safe('indexProducts', (ms) =>
    ms.index(INDEX).addDocuments(products.map(toDoc), { primaryKey: 'id' }),
  );
}

export async function removeProduct(id: string): Promise<void> {
  await safe('removeProduct', (ms) => ms.index(INDEX).deleteDocument(id));
}

function buildFilter(status?: StatusFilter, categoryId?: CategoryFilter): string[] {
  const filter: string[] = [];
  if (status && status !== 'all') filter.push(`status = "${status}"`);
  if (categoryId && categoryId !== 'all') filter.push(`categoryId = "${categoryId}"`);
  return filter;
}

/** The finite-pagination shape Meilisearch returns when given `page`/`hitsPerPage`. */
type FiniteSearchResponse = {
  hits: ProductDoc[];
  totalHits?: number;
  estimatedTotalHits?: number;
  page?: number;
  totalPages?: number;
};

/** Full-text search with the same status/category filters the list uses. */
export async function search(params: ProductSearchParams): Promise<ProductSearchResult | null> {
  const page = params.page ?? 1;
  const hitsPerPage = params.hitsPerPage ?? DEFAULT_HITS_PER_PAGE;
  return safe('search', async (ms) => {
    const response = (await ms.index(INDEX).search<ProductDoc>(params.query, {
      filter: buildFilter(params.status, params.categoryId),
      page,
      hitsPerPage,
    })) as FiniteSearchResponse;
    return {
      products: response.hits.map(fromDoc),
      total: response.totalHits ?? response.estimatedTotalHits ?? response.hits.length,
      page: response.page ?? page,
      totalPages: response.totalPages ?? 1,
    };
  });
}
