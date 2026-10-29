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

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-local';

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
  console.log(`  ${role.padEnd(6)}  ${email}  (password: ${password})`);
}

console.log('Seeding demo users into the Auth emulator:');
await ensureUser('admin@stockpilot.local', 'password123', 'admin');
await ensureUser('viewer@stockpilot.local', 'password123', 'viewer');
console.log('Done. Sign in at /sign-in with either account.');
process.exit(0);
