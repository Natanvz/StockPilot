import 'server-only';
import {
  AggregateField,
  FieldPath,
  FieldValue,
  Timestamp,
  type DocumentData,
  type Query,
} from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  ALL_CATEGORIES,
  type CategoryFilter,
  type Product,
  type ProductCursor,
  type ProductPage,
  type ProductStats,
  type SortKey,
  type StatusFilter,
} from '@/lib/types/product';
import { STATUS } from '@/lib/validation/product';
import type { CreateProductInput, UpdateProductInput } from '@/lib/validation/product';

export type { Product };

/**
 * What the repository writes for a product. The client sends a `categoryId`
 * (validated by the Zod schema); the route resolves the category and passes its
 * `name` here, so the stored document carries both (ADR 0016 — denormalized name).
 */
export type CreateProductData = CreateProductInput & { category: string };
export type UpdateProductData = UpdateProductInput & { category?: string };

const COLLECTION = 'products';

/** Default list page size — intentionally small so pagination is easy to see/demo. */
export const DEFAULT_PAGE_SIZE = 5;

/** Each sort maps to a Firestore field + direction (ADR 0015). */
const SORTS: Record<SortKey, { field: 'createdAt' | 'name' | 'price'; direction: 'asc' | 'desc' }> =
  {
    newest: { field: 'createdAt', direction: 'desc' },
    name: { field: 'name', direction: 'asc' },
    priceLow: { field: 'price', direction: 'asc' },
    priceHigh: { field: 'price', direction: 'desc' },
  };

/** The cursor value = the sort field's value on the last item of the page. */
function cursorValueFor(sort: SortKey, product: Product): string | number {
  const { field } = SORTS[sort];
  if (field === 'name') return product.name;
  if (field === 'price') return product.price;
  return product.createdAt ?? '';
}

/** Convert a cursor value back to the type `startAfter` expects for this sort. */
function startAfterValue(sort: SortKey, value: string | number): string | number | Timestamp {
  const { field } = SORTS[sort];
  if (field === 'name') return String(value);
  if (field === 'price') return Number(value);
  return Timestamp.fromDate(new Date(String(value)));
}

/** Apply the status filter to a query (no-op for `all`). */
function withStatus(query: Query, status: StatusFilter | undefined): Query {
  return status && status !== 'all' ? query.where('status', '==', status) : query;
}

/** Apply the category filter to a query (no-op for `all`/unset). */
function withCategory(query: Query, categoryId: CategoryFilter | undefined): Query {
  return categoryId && categoryId !== ALL_CATEGORIES
    ? query.where('categoryId', '==', categoryId)
    : query;
}

/** Apply both equality filters (status, then category). */
function withFilters(
  query: Query,
  filters: { status?: StatusFilter; categoryId?: CategoryFilter },
): Query {
  return withCategory(withStatus(query, filters.status), filters.categoryId);
}

function isoOrNull(value: unknown): string | null {
  return value ? (value as Timestamp).toDate().toISOString() : null;
}

/** Map a Firestore document to the API-facing Product shape. */
export function toProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: data.name,
    categoryId: data.categoryId,
    category: data.category,
    price: data.price,
    status: data.status,
    ownerId: data.ownerId,
    createdAt: isoOrNull(data.createdAt),
    updatedAt: isoOrNull(data.updatedAt),
  };
}

/**
 * The only module that reads or writes Firestore for products (core-belief #2).
 * Decoupled from both HTTP and Firestore specifics so it stays unit-testable and
 * swappable (ADR 0002).
 */
export const productRepository = {
  /**
   * One page of products, filtered + sorted server-side, via cursor pagination
   * (ADR 0015): `startAfter` on (sort field, documentId) keeps paging cost flat —
   * never numeric offsets. `nextCursor` is null on the last page.
   */
  async list(
    options: {
      limit?: number;
      cursor?: ProductCursor | null;
      status?: StatusFilter;
      categoryId?: CategoryFilter;
      sort?: SortKey;
    } = {},
  ): Promise<ProductPage> {
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const sort = options.sort ?? 'newest';
    const { field, direction } = SORTS[sort];

    let query = withFilters(getAdminDb().collection(COLLECTION), options)
      .orderBy(field, direction)
      .orderBy(FieldPath.documentId());
    if (options.cursor) {
      query = query.startAfter(startAfterValue(sort, options.cursor.value), options.cursor.id);
    }

    const snapshot = await query.limit(limit).get();
    const products = snapshot.docs.map((doc) => toProduct(doc.id, doc.data()));
    const last = products.at(-1);
    const nextCursor =
      products.length === limit && last ? { value: cursorValueFor(sort, last), id: last.id } : null;
    return { products, nextCursor };
  },

  /** Count products matching the status + category filters (cheap `count()` aggregation). */
  async count(
    options: { status?: StatusFilter; categoryId?: CategoryFilter } = {},
  ): Promise<number> {
    const query = withFilters(getAdminDb().collection(COLLECTION), options);
    const snapshot = await query.count().get();
    return snapshot.data().count;
  },

  /**
   * Catalog metrics, computed with Firestore aggregation queries so the dashboard
   * reads a few numbers instead of scanning the collection (ADR 0006). At larger
   * write volumes these move to maintained counter documents.
   */
  async getStats(): Promise<ProductStats> {
    const collection = getAdminDb().collection(COLLECTION);
    const totalSnap = await collection.count().get();
    const activeSnap = await collection
      .where('status', '==', STATUS.ACTIVE)
      .aggregate({ count: AggregateField.count(), value: AggregateField.sum('price') })
      .get();
    return {
      total: totalSnap.data().count,
      activeCount: activeSnap.data().count,
      activeValueCents: activeSnap.data().value ?? 0,
    };
  },

  async getById(id: string): Promise<Product | null> {
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    return doc.exists ? toProduct(doc.id, doc.data() as DocumentData) : null;
  },

  async create(data: CreateProductData, ownerId: string): Promise<Product> {
    const now = FieldValue.serverTimestamp();
    const ref = await getAdminDb()
      .collection(COLLECTION)
      .add({ ...data, ownerId, createdAt: now, updatedAt: now });
    const doc = await ref.get();
    return toProduct(doc.id, doc.data() as DocumentData);
  },

  async update(id: string, data: UpdateProductData): Promise<Product | null> {
    const ref = getAdminDb().collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      return null;
    }
    await ref.update({ ...data, updatedAt: FieldValue.serverTimestamp() });
    const doc = await ref.get();
    return toProduct(doc.id, doc.data() as DocumentData);
  },

  async remove(id: string): Promise<boolean> {
    const ref = getAdminDb().collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      return false;
    }
    await ref.delete();
    return true;
  },

  /** All products in a category (unbounded) — used to reindex search after a rename. */
  async listByCategory(categoryId: string): Promise<Product[]> {
    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .where('categoryId', '==', categoryId)
      .get();
    return snapshot.docs.map((doc) => toProduct(doc.id, doc.data()));
  },

  /** How many products reference a category — used to block its deletion (ADR 0016). */
  async countByCategory(categoryId: string): Promise<number> {
    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .where('categoryId', '==', categoryId)
      .count()
      .get();
    return snapshot.data().count;
  },

  /**
   * Refresh the denormalized category `name` on every product in a category after
   * it is renamed (ADR 0016 — fan-out). Batched into one write; returns the count.
   */
  async renameCategory(categoryId: string, name: string): Promise<number> {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTION).where('categoryId', '==', categoryId).get();
    if (snapshot.empty) {
      return 0;
    }
    const batch = db.batch();
    const updatedAt = FieldValue.serverTimestamp();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { category: name, updatedAt }));
    await batch.commit();
    return snapshot.size;
  },
};
