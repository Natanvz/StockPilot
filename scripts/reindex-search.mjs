// Rebuild the Meilisearch product index from Firestore (ADR 0018).
//
// Firestore is the source of truth; the search index is a derived read model.
// Run this once to set up the index (searchable/filterable/sortable attributes)
// and to recover from any drift:
//
//   npm run search            # start Meilisearch locally (Docker), in one terminal
//   npm run reindex:search    # then rebuild the index from the emulator's products
//
// Targets the Firestore emulator + a local Meilisearch by default; override via env
// (MEILI_HOST, MEILI_API_KEY, FIRESTORE_EMULATOR_HOST) for a real environment.

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { Meilisearch } from 'meilisearch';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-local';
const host = process.env.MEILI_HOST ?? 'http://127.0.0.1:7700';
const apiKey = process.env.MEILI_API_KEY || undefined;

initializeApp({ projectId });
const db = getFirestore();
const meili = new Meilisearch({ host, apiKey });

function toDoc(doc) {
  const data = doc.data();
  const createdAt = data.createdAt ? data.createdAt.toDate().toISOString() : null;
  const updatedAt = data.updatedAt ? data.updatedAt.toDate().toISOString() : null;
  return {
    id: doc.id,
    name: data.name,
    categoryId: data.categoryId ?? '',
    category: data.category ?? '',
    price: data.price,
    status: data.status,
    ownerId: data.ownerId ?? '',
    createdAt,
    updatedAt,
    createdAtMs: createdAt ? Date.parse(createdAt) : 0,
  };
}

await meili.createIndex('products', { primaryKey: 'id' }).catch(() => undefined);
await meili.index('products').updateSettings({
  searchableAttributes: ['name', 'category'],
  filterableAttributes: ['status', 'categoryId'],
  sortableAttributes: ['createdAtMs', 'price'],
});

const snapshot = await db.collection('products').get();
const docs = snapshot.docs.map(toDoc);
if (docs.length > 0) {
  await meili.index('products').addDocuments(docs, { primaryKey: 'id' });
}

console.log(`Reindexed ${docs.length} product(s) into Meilisearch at ${host}.`);
process.exit(0);
