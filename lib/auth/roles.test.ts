import { describe, expect, it } from 'vitest';
import { DEFAULT_ROLE, toRole } from './roles';

describe('toRole', () => {
  it('returns "admin" for the admin claim', () => {
    expect(toRole('admin')).toBe('admin');
  });

  it('returns "viewer" for the viewer claim', () => {
    expect(toRole('viewer')).toBe('viewer');
  });

  it('defaults to viewer for a missing claim', () => {
    expect(toRole(undefined)).toBe(DEFAULT_ROLE);
    expect(toRole(null)).toBe('viewer');
  });

  it('defaults to viewer for any unknown value (no privilege escalation)', () => {
    expect(toRole('superadmin')).toBe('viewer');
    expect(toRole(true)).toBe('viewer');
    expect(toRole({})).toBe('viewer');
  });
});
