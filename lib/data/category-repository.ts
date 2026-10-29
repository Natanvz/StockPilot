import 'server-only';
import { FieldValue, Timestamp, type DocumentData } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import type { Category } from '@/lib/types/category';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/validation/category';

export type { Category };

const COLLECTION = 'categories';

function isoOrNull(value: unknown): string | null {
  return value ? (value as Timestamp).toDate().toISOString() : null;
}

/** Map a Firestore document to the API-facing Category shape. */
export function toCategory(id: string, data: DocumentData): Category {
  return {
    id,
    name: data.name,
    ownerId: data.ownerId,
    createdAt: isoOrNull(data.createdAt),
    updatedAt: isoOrNull(data.updatedAt),
  };
}

/**
 * The only module that reads or writes Firestore for categories (core-belief #2).
 * Mirrors the products repository (ADR 0002). Categories are a small, bounded set
 * (an admin-managed list), so `list()` returns them all, ordered by name — no
 * pagination needed.
 */
export const categoryRepository = {
  async list(): Promise<Category[]> {
    const snapshot = await getAdminDb().collection(COLLECTION).orderBy('name').get();
    return snapshot.docs.map((doc) => toCategory(doc.id, doc.data()));
  },

  async getById(id: string): Promise<Category | null> {
    const doc = await getAdminDb().collection(COLLECTION).doc(id).get();
    return doc.exists ? toCategory(doc.id, doc.data() as DocumentData) : null;
  },

  async create(input: CreateCategoryInput, ownerId: string): Promise<Category> {
    const now = FieldValue.serverTimestamp();
    const ref = await getAdminDb()
      .collection(COLLECTION)
      .add({ ...input, ownerId, createdAt: now, updatedAt: now });
    const doc = await ref.get();
    return toCategory(doc.id, doc.data() as DocumentData);
  },

  async update(id: string, input: UpdateCategoryInput): Promise<Category | null> {
    const ref = getAdminDb().collection(COLLECTION).doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      return null;
    }
    await ref.update({ ...input, updatedAt: FieldValue.serverTimestamp() });
    const doc = await ref.get();
    return toCategory(doc.id, doc.data() as DocumentData);
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
