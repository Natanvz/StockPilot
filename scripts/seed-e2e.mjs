// Seed deterministic e2e data (users + categories) before the test run.
// FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST are set by
// `firebase emulators:exec`.

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-e2e';
initializeApp({ projectId });
const auth = getAuth();
const db = getFirestore();

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

const admin = await ensureUser('admin@e2e.test', 'password123', 'admin');
await ensureUser('viewer@e2e.test', 'password123', 'viewer');
await ensureCategory('cat-gadgets', 'Gadgets', admin.uid);
await ensureCategory('cat-gizmos', 'Gizmos', admin.uid);
console.log('e2e users + categories seeded');
process.exit(0);
