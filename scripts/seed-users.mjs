// Create ready-to-use demo accounts (one admin, one viewer) in the running
// local emulator, so you can sign in without manually registering first.
//
//   admin@stockpilot.local  / password123   (admin)
//   viewer@stockpilot.local / password123   (viewer)
//
// Run while `npm run emulators` is up: `npm run seed:users`. With emulator data
// persistence (the default), the accounts survive restarts — run this once.

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080';
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-local';

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
  console.log(`  ${role.padEnd(6)}  ${email}  (password: ${password})`);
  return user;
}

// Products need a category to pick (ADR 0016), so seed a couple to start with.
async function ensureCategory(id, name, ownerId) {
  const now = FieldValue.serverTimestamp();
  await db
    .collection('categories')
    .doc(id)
    .set({ name, ownerId, createdAt: now, updatedAt: now }, { merge: true });
  console.log(`  category  ${name}`);
}

console.log('Seeding demo users into the Auth emulator:');
const admin = await ensureUser('admin@stockpilot.local', 'password123', 'admin');
await ensureUser('viewer@stockpilot.local', 'password123', 'viewer');
console.log('Seeding demo categories into the Firestore emulator:');
await ensureCategory('cat-gadgets', 'Gadgets', admin.uid);
await ensureCategory('cat-gizmos', 'Gizmos', admin.uid);
console.log('Done. Sign in at /sign-in with either account.');
process.exit(0);
