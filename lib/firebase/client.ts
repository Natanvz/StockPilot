'use client';

import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';

let cachedAuth: Auth | null = null;

/**
 * Lazily initialize the Firebase client Auth. Lazy (not module-level) so that
 * server-side prerendering, which evaluates this module, doesn't construct
 * Firebase with missing env vars. Only called from event handlers in the browser.
 *
 * The API key falls back to a placeholder so local emulator development works
 * without a real Firebase project (the emulator ignores the key).
 */
export function getClientAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stockpilot-local',
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  const app: FirebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);

  if (
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === '1' &&
    typeof window !== 'undefined' &&
    !('_stockpilotEmulatorConnected' in globalThis)
  ) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    (globalThis as Record<string, unknown>)._stockpilotEmulatorConnected = true;
  }

  cachedAuth = auth;
  return auth;
}
