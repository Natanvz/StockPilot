// One-off migration: promote the old free-text `category` string on each product
// to a real category document, and set the product's `categoryId` (ADR 0016).
//
// Products created before categories were a collection carry a `category` name but
// no `categoryId`. This script, for each such product:
//   1. finds or creates a category with that name (reusing one id per distinct name),
//   2. sets the product's `categoryId` (and keeps `category` as the denormalized name).
//
// It is idempotent: products that already have a `categoryId` are skipped, and a
// re-run reuses the categories created on the first pass.
//
// Targets the emulator by default (no credentials needed):
//   npm run migrate:categories
// Against a real project, provide service-account credentials via the environment.

import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-local';

initializeApp({ projectId });
const db = getFirestore();

/** Return the id of a category with this name, creating one if needed. */
async function findOrCreateCategory(name, cache) {
  const key = name.trim();
  if (cache.has(key)) {
    return cache.get(key);
  }
  const existing = await db.collection('categories').where('name', '==', key).limit(1).get();
  if (!existing.empty) {
    cache.set(key, existing.docs[0].id);
    return existing.docs[0].id;
  }
  const now = FieldValue.serverTimestamp();
  const ref = await db
    .collection('categories')
    .add({ name: key, ownerId: 'migration', createdAt: now, updatedAt: now });
  cache.set(key, ref.id);
  console.log(`  created category "${key}"`);
  return ref.id;
}

const products = await db.collection('products').get();
const cache = new Map();
let migrated = 0;

for (const doc of products.docs) {
  const data = doc.data();
  if (data.categoryId) {
    continue; // already migrated
  }
  const name = data.category ?? 'Uncategorized';
  const categoryId = await findOrCreateCategory(name, cache);
  await doc.ref.update({ categoryId, category: name, updatedAt: FieldValue.serverTimestamp() });
  migrated += 1;
}

console.log(
  `Backfill complete: ${migrated} product(s) updated, ${cache.size} categor(y/ies) in use.`,
);
process.exit(0);
