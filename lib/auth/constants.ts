/**
 * Auth constants with no server-only dependencies, so both the Edge middleware
 * and Node server code can import them.
 */
export const SESSION_COOKIE = 'session';

/** Session lifetime: 5 days. */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 5;
