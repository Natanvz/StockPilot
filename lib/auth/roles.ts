/** The two roles StockPilot supports (ADR 0004). */
export const ROLES = ['admin', 'viewer'] as const;

export type Role = (typeof ROLES)[number];

/** Named role values, to avoid bare 'admin'/'viewer' literals in logic. */
export const ROLE = {
  ADMIN: 'admin',
  VIEWER: 'viewer',
} as const satisfies Record<string, Role>;

export const DEFAULT_ROLE: Role = ROLE.VIEWER;

/** Narrow an unknown custom-claim value to a Role, defaulting to viewer. */
export function toRole(value: unknown): Role {
  return value === ROLE.ADMIN ? ROLE.ADMIN : DEFAULT_ROLE;
}
