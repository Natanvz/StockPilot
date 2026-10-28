import 'server-only';
import {
  AggregateField,
  FieldPath,
  FieldValue,
  Timestamp,
  type DocumentData,
} from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import type { Product, ProductCursor, ProductPage, ProductStats } from '@/lib/types/product';
import type { CreateProductInput, UpdateProductInput } from '@/lib/validation/product';

export type { Product };

const COLLECTION = 'products';

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
   * One page of products, newest first, via cursor pagination (ADR 0006):
   * `startAfter` on (createdAt, documentId) keeps paging cost flat regardless of
   * how deep you are — never numeric offsets. `nextCursor` is null on the last page.
   */
  async list(
    options: { limit?: number; cursor?: ProductCursor | null } = {},
  ): Promise<ProductPage> {
    const limit = options.limit ?? 20;
    let query = getAdminDb()
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .orderBy(FieldPath.documentId());

    if (options.cursor) {
      query = query.startAfter(
        Timestamp.fromDate(new Date(options.cursor.createdAt)),
        options.cursor.id,
      );
    }

    const snapshot = await query.limit(limit).get();
    const products = snapshot.docs.map((doc) => toProduct(doc.id, doc.data()));
    const last = snapshot.docs.at(-1);
    const nextCursor =
      snapshot.docs.length === limit && last
        ? { createdAt: toProduct(last.id, last.data()).createdAt ?? '', id: last.id }
        : null;
    return { products, nextCursor };
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
      .where('status', '==', 'active')
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
