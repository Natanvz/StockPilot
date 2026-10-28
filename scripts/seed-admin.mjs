// Grant the `admin` custom claim to an existing user, by email.
// Usage: npm run seed:admin -- you@example.com
//
// Targets the Auth emulator by default (no credentials needed). The user must
// already exist — sign up through the UI first — and must sign out/in again for
// the new claim to take effect in their session.

import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const email = process.argv[2];
if (!email) {
  console.error('Usage: npm run seed:admin -- <email>');
  process.exit(1);
}

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099';
const projectId = process.env.FIREBASE_PROJECT_ID ?? 'stockpilot-local';

initializeApp({ projectId });
const auth = getAuth();

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`Granted admin to ${email} (uid ${user.uid}).`);
  console.log('They must sign out and back in for the role to take effect.');
  process.exit(0);
} catch (error) {
  console.error(
    `Failed to grant admin to ${email}:`,
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
}
