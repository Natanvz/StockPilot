import 'server-only';
import { FieldValue, type DocumentData, type Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import type {
  CreateProductInput,
  ProductStatus,
  UpdateProductInput,
} from '@/lib/validation/product';

const COLLECTION = 'products';

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
  async list(max = 50): Promise<Product[]> {
    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(max)
      .get();
    return snapshot.docs.map((doc) => toProduct(doc.id, doc.data()));
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
