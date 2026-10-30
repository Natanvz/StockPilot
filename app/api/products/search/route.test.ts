import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requireUser } from '@/lib/auth/guards';
import { isSearchEnabled, search } from '@/lib/search/product-index';
import { GET } from './route';

vi.mock('@/lib/auth/guards', () => {
  class AuthError extends Error {
    constructor(
      public readonly status: number,
      message: string,
    ) {
      super(message);
      this.name = 'AuthError';
    }
  }
  return { AuthError, requireUser: vi.fn() };
});
vi.mock('@/lib/search/product-index', () => ({ isSearchEnabled: vi.fn(), search: vi.fn() }));

const mockRequireUser = vi.mocked(requireUser);
const mockIsEnabled = vi.mocked(isSearchEnabled);
const mockSearch = vi.mocked(search);

function get(url: string): Promise<Response> {
  return GET(new Request(url));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue({ uid: 'u1', email: null, role: 'admin' });
});

describe('GET /api/products/search', () => {
  it('returns 401 when unauthenticated', async () => {
    const { AuthError } = await import('@/lib/auth/guards');
    mockRequireUser.mockRejectedValueOnce(new AuthError(401, 'Authentication required'));
    const res = await get('http://localhost/api/products/search?q=x');
    expect(res.status).toBe(401);
  });

  it('returns 503 when search is disabled', async () => {
    mockIsEnabled.mockReturnValue(false);
    const res = await get('http://localhost/api/products/search?q=x');
    expect(res.status).toBe(503);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('returns 502 when enabled but the engine is unreachable', async () => {
    mockIsEnabled.mockReturnValue(true);
    mockSearch.mockResolvedValue(null);
    const res = await get('http://localhost/api/products/search?q=x');
    expect(res.status).toBe(502);
  });

  it('parses query/filters/page and returns the result on success', async () => {
    mockIsEnabled.mockReturnValue(true);
    const result = { products: [], total: 0, page: 2, totalPages: 0 };
    mockSearch.mockResolvedValue(result);
    const res = await get(
      'http://localhost/api/products/search?q=wid&status=active&categoryId=cat-1&page=2',
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(result);
    expect(mockSearch).toHaveBeenCalledWith({
      query: 'wid',
      status: 'active',
      categoryId: 'cat-1',
      page: 2,
    });
  });

  it('defaults a missing/invalid status to all and page to 1', async () => {
    mockIsEnabled.mockReturnValue(true);
    mockSearch.mockResolvedValue({ products: [], total: 0, page: 1, totalPages: 0 });
    await get('http://localhost/api/products/search?q=wid');
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'all', categoryId: 'all', page: 1 }),
    );
  });
});
