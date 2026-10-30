import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/lib/types/product';
import { indexProduct, isSearchEnabled, removeProduct, search } from './product-index';

const m = vi.hoisted(() => {
  const addDocuments = vi.fn().mockResolvedValue({ taskUid: 1 });
  const deleteDocument = vi.fn().mockResolvedValue({ taskUid: 2 });
  const searchFn = vi.fn();
  const index = vi.fn(() => ({ addDocuments, deleteDocument, search: searchFn }));
  const createIndex = vi.fn().mockResolvedValue({ taskUid: 0 });
  const Meilisearch = vi.fn(function () {
    return { index, createIndex };
  });
  return { addDocuments, deleteDocument, searchFn, index, Meilisearch };
});

vi.mock('meilisearch', () => ({ Meilisearch: m.Meilisearch }));

const product: Product = {
  id: 'p1',
  name: 'Widget',
  categoryId: 'cat-1',
  category: 'Tools',
  price: 1999,
  status: 'active',
  ownerId: 'owner-1',
  createdAt: '2026-01-02T03:04:05.000Z',
  updatedAt: '2026-01-02T03:04:05.000Z',
};

function enableSearch() {
  vi.stubEnv('MEILI_HOST', 'http://127.0.0.1:7700');
  vi.stubEnv('MEILI_API_KEY', 'test-key');
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isSearchEnabled', () => {
  it('is false when MEILI_HOST is unset or blank', () => {
    vi.stubEnv('MEILI_HOST', '');
    expect(isSearchEnabled()).toBe(false);
  });

  it('is true when MEILI_HOST is set', () => {
    enableSearch();
    expect(isSearchEnabled()).toBe(true);
  });
});

describe('when search is disabled', () => {
  beforeEach(() => vi.stubEnv('MEILI_HOST', ''));

  it('indexProduct is a no-op', async () => {
    await indexProduct(product);
    expect(m.addDocuments).not.toHaveBeenCalled();
  });

  it('search returns null', async () => {
    await expect(search({ query: 'widget' })).resolves.toBeNull();
  });
});

describe('when search is enabled', () => {
  beforeEach(enableSearch);

  it('indexProduct writes a doc with a numeric createdAtMs and primary key', async () => {
    await indexProduct(product);
    expect(m.addDocuments).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          id: 'p1',
          name: 'Widget',
          createdAtMs: Date.parse(product.createdAt!),
        }),
      ],
      { primaryKey: 'id' },
    );
  });

  it('removeProduct deletes by id', async () => {
    await removeProduct('p1');
    expect(m.deleteDocument).toHaveBeenCalledWith('p1');
  });

  it('search maps hits and passes status/category as filters', async () => {
    m.searchFn.mockResolvedValueOnce({
      hits: [{ ...product, createdAtMs: 1 }],
      totalHits: 1,
      page: 1,
      totalPages: 1,
    });
    const result = await search({ query: 'wid', status: 'active', categoryId: 'cat-1', page: 1 });
    expect(m.searchFn).toHaveBeenCalledWith(
      'wid',
      expect.objectContaining({ filter: ['status = "active"', 'categoryId = "cat-1"'] }),
    );
    expect(result).toEqual({
      products: [product],
      total: 1,
      page: 1,
      totalPages: 1,
    });
  });

  it('swallows a Meilisearch error on write (best-effort, never throws)', async () => {
    m.addDocuments.mockRejectedValueOnce(new Error('connection refused'));
    await expect(indexProduct(product)).resolves.toBeUndefined();
  });

  it('returns null when a search call throws', async () => {
    m.searchFn.mockRejectedValueOnce(new Error('connection refused'));
    await expect(search({ query: 'x' })).resolves.toBeNull();
  });
});
