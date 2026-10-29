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
import type {
  Product,
  ProductCursor,
  ProductPage,
  ProductStats,
  SortKey,
  StatusFilter,
} from '@/lib/types/product';
import { STATUS } from '@/lib/validation/product';
import type { CreateProductInput, UpdateProductInput } from '@/lib/validation/product';

export type { Product };

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

function isoOrNull(value: unknown): string | null {
  return value ? (value as Timestamp).toDate().toISOString() : null;
}

/** Map a Firestore document to the API-facing Product shape. */
export function toProduct(id: string, data: DocumentData): Product {
  return {
    id,
    name: data.name,
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
      sort?: SortKey;
    } = {},
  ): Promise<ProductPage> {
    const limit = options.limit ?? DEFAULT_PAGE_SIZE;
    const sort = options.sort ?? 'newest';
    const { field, direction } = SORTS[sort];

    let query = withStatus(getAdminDb().collection(COLLECTION), options.status)
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

  /** Count products matching the status filter (cheap `count()` aggregation). */
  async count(options: { status?: StatusFilter } = {}): Promise<number> {
    const query = withStatus(getAdminDb().collection(COLLECTION), options.status);
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

  async create(input: CreateProductInput, ownerId: string): Promise<Product> {
    const now = FieldValue.serverTimestamp();
    const ref = await getAdminDb()
      .collection(COLLECTION)
      .add({ ...input, ownerId, createdAt: now, updatedAt: now });
    const doc = await ref.get();
    return toProduct(doc.id, doc.data() as DocumentData);
  },

  async update(id: string, input: UpdateProductInput): Promise<Product | null> {
    const ref = getAdminDb().collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      return null;
    }
    await ref.update({ ...input, updatedAt: FieldValue.serverTimestamp() });
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
};
