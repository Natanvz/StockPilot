import 'server-only';
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Server-side Firebase Admin SDK (ADR 0004). This is the only place that holds
 * service-account credentials — never the client bundle (core-belief #4).
 *
 * Against the emulator the Admin SDK auto-detects FIREBASE_AUTH_EMULATOR_HOST and
 * needs no real credentials, only a project id.
 */
function createAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

let cachedAuth: Auth | null = null;

/**
 * Lazily initialize the Admin Auth instance. Lazy (not module-level) so that
 * importing this file during the build doesn't try to read credentials that
 * only exist at runtime.
 */
export function getAdminAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(createAdminApp());
  }
  return cachedAuth;
}

let cachedDb: Firestore | null = null;

/** Lazily initialize Admin Firestore (auto-detects FIRESTORE_EMULATOR_HOST locally). */
export function getAdminDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(createAdminApp());
  }
  return cachedDb;
}
