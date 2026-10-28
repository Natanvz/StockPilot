import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError, requireRole, requireUser } from './guards';
import { getSessionUser } from './session';
import type { SessionUser } from './session';

// Isolate the guard logic from Firebase/next by mocking the session reader.
vi.mock('./session', () => ({ getSessionUser: vi.fn() }));

const mockGetSessionUser = vi.mocked(getSessionUser);
const admin: SessionUser = { uid: 'u-admin', email: 'admin@example.com', role: 'admin' };
const viewer: SessionUser = { uid: 'u-viewer', email: 'viewer@example.com', role: 'viewer' };

beforeEach(() => {
  vi.resetAllMocks();
});

describe('requireUser', () => {
  it('returns the user when a valid session exists', async () => {
    mockGetSessionUser.mockResolvedValue(viewer);
    await expect(requireUser()).resolves.toEqual(viewer);
  });

  it('throws AuthError(401) when there is no session', async () => {
    mockGetSessionUser.mockResolvedValue(null);
    await expect(requireUser()).rejects.toBeInstanceOf(AuthError);
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });
});

describe('requireRole', () => {
  it('allows a user whose role matches', async () => {
    mockGetSessionUser.mockResolvedValue(admin);
    await expect(requireRole('admin')).resolves.toEqual(admin);
  });

  it('throws AuthError(403) when a viewer requests an admin action', async () => {
    mockGetSessionUser.mockResolvedValue(viewer);
    await expect(requireRole('admin')).rejects.toMatchObject({ status: 403 });
  });

  it('throws AuthError(401) when unauthenticated', async () => {
    mockGetSessionUser.mockResolvedValue(null);
    await expect(requireRole('admin')).rejects.toMatchObject({ status: 401 });
  });
});
