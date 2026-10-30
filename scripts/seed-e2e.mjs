// Seed deterministic e2e data (users + categories) before the test run.
// FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST are set by
// `firebase emulators:exec`.

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { Meilisearch } from 'meilisearch';

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-e2e';
initializeApp({ projectId });
const auth = getAuth();
const db = getFirestore();

// A distinctive, pre-indexed product so the search e2e is deterministic (no
// create→index race). Only indexed when MEILI_HOST is set (the search e2e run).
const SEARCHABLE = {
  id: 'e2e-searchable',
  name: 'Zephyr Searchable Widget',
  category: 'Gizmos',
  categoryId: 'cat-gizmos',
  price: 4242,
  status: 'active',
};

async function ensureUser(email, password, role) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password });
  }
  await auth.setCustomUserClaims(user.uid, { role });
  return user;
}

// Products require a category (ADR 0016), so the e2e needs some to pick from.
async function ensureCategory(id, name, ownerId) {
  const now = FieldValue.serverTimestamp();
  await db
    .collection('categories')
    .doc(id)
    .set({ name, ownerId, createdAt: now, updatedAt: now }, { merge: true });
}

// Write the searchable product to Firestore and, when search is on, to Meilisearch.
async function seedSearchableProduct(ownerId) {
  const now = FieldValue.serverTimestamp();
  await db
    .collection('products')
    .doc(SEARCHABLE.id)
    .set({ ...SEARCHABLE, ownerId, createdAt: now, updatedAt: now }, { merge: true });

  const host = process.env.MEILI_HOST;
  if (!host) return;
  const meili = new Meilisearch({ host, apiKey: process.env.MEILI_API_KEY || undefined });
  await meili.createIndex('products', { primaryKey: 'id' }).catch(() => undefined);
  // Meilisearch processes tasks in order, so waiting on the add also covers settings.
  await meili.index('products').updateSettings({
    searchableAttributes: ['name', 'category'],
    filterableAttributes: ['status', 'categoryId'],
    sortableAttributes: ['createdAtMs', 'price'],
  });
  const doc = { ...SEARCHABLE, ownerId, createdAt: null, updatedAt: null, createdAtMs: Date.now() };
  const task = await meili.index('products').addDocuments([doc], { primaryKey: 'id' });
  // Generous timeout: a cold Meilisearch (CI) processes createIndex→settings→add in
  // sequence, which can exceed the client's short default. Ensure it's searchable first.
  await meili.tasks.waitForTask(task.taskUid, { timeout: 60_000 });
  console.log('e2e search index seeded');
}

const admin = await ensureUser('admin@e2e.test', 'password123', 'admin');
await ensureUser('viewer@e2e.test', 'password123', 'viewer');
await ensureCategory('cat-gadgets', 'Gadgets', admin.uid);
await ensureCategory('cat-gizmos', 'Gizmos', admin.uid);
await seedSearchableProduct(admin.uid);
console.log('e2e users + categories seeded');
process.exit(0);
