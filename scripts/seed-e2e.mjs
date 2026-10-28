// Seed deterministic e2e users into the Auth emulator before the test run.
// FIREBASE_AUTH_EMULATOR_HOST is set by `firebase emulators:exec`.

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-e2e';
initializeApp({ projectId });
const auth = getAuth();

async function ensureUser(email, password, role) {
  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password });
  }
  await auth.setCustomUserClaims(user.uid, { role });
}

await ensureUser('admin@e2e.test', 'password123', 'admin');
await ensureUser('viewer@e2e.test', 'password123', 'viewer');
console.log('e2e users seeded');
process.exit(0);
