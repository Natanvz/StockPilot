/** The two roles StockPilot supports (ADR 0004). */
export const ROLES = ['admin', 'viewer'] as const;

export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = 'viewer';

/** Narrow an unknown custom-claim value to a Role, defaulting to viewer. */
export function toRole(value: unknown): Role {
  return value === 'admin' ? 'admin' : DEFAULT_ROLE;
}
