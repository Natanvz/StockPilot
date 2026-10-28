import 'server-only';
import { cookies } from 'next/headers';
import { getAdminAuth } from '@/lib/firebase/admin';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from './constants';
import { toRole, type Role } from './roles';

export type SessionUser = {
  uid: string;
  email: string | null;
  role: Role;
};

/** Verify a Firebase ID token and mint an httpOnly session cookie (ADR 0004). */
export async function createSessionCookie(idToken: string): Promise<string> {
  return getAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1000,
  });
}

/** Read and verify the current session cookie. Returns null when absent or invalid. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: toRole(decoded.role),
    };
  } catch {
    return null;
  }
}
