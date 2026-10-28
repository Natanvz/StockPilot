import 'server-only';
import { getSessionUser, type SessionUser } from './session';
import type { Role } from './roles';

/** Thrown by the guards; carries the HTTP status a route handler should return. */
export class AuthError extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Require any authenticated user. Throws AuthError(401) otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError(401, 'Authentication required');
  }
  return user;
}

/**
 * Require an authenticated user with the given role. Throws AuthError(401) when
 * unauthenticated, AuthError(403) when the role does not match. This is the
 * server-side enforcement — never rely on hidden UI (core-belief #1).
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) {
    throw new AuthError(403, 'Insufficient permissions');
  }
  return user;
}
