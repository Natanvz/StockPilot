import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminDb } from '@/lib/firebase/admin';
import { productRepository, toProduct } from './product-repository';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: vi.fn() }));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
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

function makeDb(opts: { listDocs?: FakeDoc[]; getDoc?: FakeDoc }) {
  const get = vi.fn().mockResolvedValue(opts.getDoc);
  const update = vi.fn().mockResolvedValue(undefined);
  const del = vi.fn().mockResolvedValue(undefined);
  const docRef = { get, update, delete: del };
  const addedRef = { get: vi.fn().mockResolvedValue(opts.getDoc) };
  const add = vi.fn().mockResolvedValue(addedRef);
  const listGet = vi.fn().mockResolvedValue({ docs: opts.listDocs ?? [] });
  const collection = vi.fn(() => ({
    doc: vi.fn(() => docRef),
    add,
    orderBy: vi.fn(() => ({ limit: vi.fn(() => ({ get: listGet })) })),
  }));
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
  it('maps every returned document', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ listDocs: [fakeDoc('p1', docData)] }).db);
    const products = await productRepository.list();
    expect(products).toHaveLength(1);
    expect(products[0].id).toBe('p1');
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
