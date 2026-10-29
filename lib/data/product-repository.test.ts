import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminDb } from '@/lib/firebase/admin';
import { productRepository, toProduct } from './product-repository';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: vi.fn() }));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  FieldPath: { documentId: () => '__name__' },
  Timestamp: { fromDate: (date: Date) => date },
  AggregateField: { count: () => 'COUNT', sum: (field: string) => `SUM(${field})` },
}));

const mockGetAdminDb = vi.mocked(getAdminDb);

const ts = { toDate: () => new Date('2026-01-02T03:04:05.000Z') };
const docData = {
  name: 'Widget',
  category: 'Tools',
  price: 1999,
  status: 'active',
  ownerId: 'owner-1',
  createdAt: ts,
  updatedAt: ts,
};

type FakeDoc = { id: string; exists: boolean; data: () => unknown };
const fakeDoc = (id: string, data: unknown | null): FakeDoc => ({
  id,
  exists: data !== null,
  data: () => data,
});

type StatOpts = { total?: number; activeCount?: number; activeValue?: number };

function makeDb(opts: { listDocs?: FakeDoc[]; getDoc?: FakeDoc } & StatOpts) {
  const get = vi.fn().mockResolvedValue(opts.getDoc);
  const update = vi.fn().mockResolvedValue(undefined);
  const del = vi.fn().mockResolvedValue(undefined);
  const docRef = { get, update, delete: del };
  const addedRef = { get: vi.fn().mockResolvedValue(opts.getDoc) };
  const add = vi.fn().mockResolvedValue(addedRef);

  // list(): [where()].orderBy().orderBy().limit()[.startAfter()].get()
  const listGet = vi.fn().mockResolvedValue({ docs: opts.listDocs ?? [] });
  const limit = vi.fn(() => ({ get: listGet }));
  const startAfter = vi.fn(() => ({ limit }));
  const orderBy2 = vi.fn(() => ({ limit, startAfter }));
  const orderBy1 = vi.fn(() => ({ orderBy: orderBy2 }));

  // count(): [where()].count().get(); getStats(): count() + where().aggregate().get()
  const countGet = vi.fn().mockResolvedValue({ data: () => ({ count: opts.total ?? 0 }) });
  const count = vi.fn(() => ({ get: countGet }));
  const aggGet = vi
    .fn()
    .mockResolvedValue({ data: () => ({ count: opts.activeCount ?? 0, value: opts.activeValue }) });
  const aggregate = vi.fn(() => ({ get: aggGet }));

  // where() and the collection both expose orderBy / count / aggregate.
  const queryable = { orderBy: orderBy1, count, aggregate };
  const where = vi.fn(() => queryable);
  const collection = vi.fn(() => ({ ...queryable, where, doc: vi.fn(() => docRef), add }));
  return { db: { collection } as unknown as ReturnType<typeof getAdminDb>, docRef, add };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('toProduct', () => {
  it('maps fields and converts timestamps to ISO', () => {
    expect(toProduct('p1', docData)).toEqual({
      id: 'p1',
      name: 'Widget',
      category: 'Tools',
      price: 1999,
      status: 'active',
      ownerId: 'owner-1',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:04:05.000Z',
    });
  });

  it('tolerates missing timestamps', () => {
    const product = toProduct('p1', { ...docData, createdAt: undefined, updatedAt: null });
    expect(product.createdAt).toBeNull();
    expect(product.updatedAt).toBeNull();
  });
});

describe('productRepository.list', () => {
  it('maps the page and returns no cursor when the page is not full', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ listDocs: [fakeDoc('p1', docData)] }).db);
    const page = await productRepository.list({ limit: 20 });
    expect(page.products).toHaveLength(1);
    expect(page.products[0].id).toBe('p1');
    expect(page.nextCursor).toBeNull();
  });

  it('returns a cursor (sort value + id) from the last item when the page is full', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ listDocs: [fakeDoc('p1', docData)] }).db);
    const page = await productRepository.list({ limit: 1, sort: 'newest' });
    expect(page.nextCursor).toEqual({ value: '2026-01-02T03:04:05.000Z', id: 'p1' });
  });

  it('uses the name as the cursor value when sorting by name', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ listDocs: [fakeDoc('p1', docData)] }).db);
    const page = await productRepository.list({ limit: 1, sort: 'name' });
    expect(page.nextCursor).toEqual({ value: 'Widget', id: 'p1' });
  });
});

describe('productRepository.count', () => {
  it('returns the count aggregation total', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ total: 7 }).db);
    await expect(productRepository.count({ status: 'active' })).resolves.toBe(7);
  });
});

describe('productRepository.getStats', () => {
  it('returns total, active count, and active value from aggregation queries', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ total: 5, activeCount: 3, activeValue: 4500 }).db);
    await expect(productRepository.getStats()).resolves.toEqual({
      total: 5,
      activeCount: 3,
      activeValueCents: 4500,
    });
  });

  it('treats a missing sum as zero', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ total: 0, activeCount: 0 }).db);
    await expect(productRepository.getStats()).resolves.toMatchObject({ activeValueCents: 0 });
  });
});

describe('productRepository.getById', () => {
  it('returns the product when it exists', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ getDoc: fakeDoc('p1', docData) }).db);
    await expect(productRepository.getById('p1')).resolves.toMatchObject({ id: 'p1' });
  });

  it('returns null when the document is missing', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ getDoc: fakeDoc('missing', null) }).db);
    await expect(productRepository.getById('missing')).resolves.toBeNull();
  });
});

describe('productRepository.create', () => {
  it('writes ownerId + timestamps and returns the created product', async () => {
    const mk = makeDb({ getDoc: fakeDoc('new', docData) });
    mockGetAdminDb.mockReturnValue(mk.db);
    const result = await productRepository.create(
      { name: 'Widget', category: 'Tools', price: 1999, status: 'active' },
      'owner-1',
    );
    expect(result.id).toBe('new');
    expect(mk.add).toHaveBeenCalledWith(
      expect.objectContaining({
        ownerId: 'owner-1',
        createdAt: 'SERVER_TS',
        updatedAt: 'SERVER_TS',
      }),
    );
  });
});

describe('productRepository.update', () => {
  it('returns null and does not write when the product is missing', async () => {
    const mk = makeDb({ getDoc: fakeDoc('missing', null) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(productRepository.update('missing', { price: 500 })).resolves.toBeNull();
    expect(mk.docRef.update).not.toHaveBeenCalled();
  });

  it('updates and returns the product when it exists', async () => {
    const mk = makeDb({ getDoc: fakeDoc('p1', docData) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(productRepository.update('p1', { price: 500 })).resolves.toMatchObject({
      id: 'p1',
    });
    expect(mk.docRef.update).toHaveBeenCalledOnce();
  });
});

describe('productRepository.remove', () => {
  it('returns false and does not delete when the product is missing', async () => {
    const mk = makeDb({ getDoc: fakeDoc('missing', null) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(productRepository.remove('missing')).resolves.toBe(false);
    expect(mk.docRef.delete).not.toHaveBeenCalled();
  });

  it('deletes and returns true when the product exists', async () => {
    const mk = makeDb({ getDoc: fakeDoc('p1', docData) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(productRepository.remove('p1')).resolves.toBe(true);
    expect(mk.docRef.delete).toHaveBeenCalledOnce();
  });
});
