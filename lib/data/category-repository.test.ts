import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAdminDb } from '@/lib/firebase/admin';
import { categoryRepository, toCategory } from './category-repository';

vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: vi.fn() }));
vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'SERVER_TS' },
  Timestamp: { fromDate: (date: Date) => date },
}));

const mockGetAdminDb = vi.mocked(getAdminDb);

const ts = { toDate: () => new Date('2026-01-02T03:04:05.000Z') };
const docData = { name: 'Tools', ownerId: 'owner-1', createdAt: ts, updatedAt: ts };

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

  // list(): collection().orderBy('name').get()
  const listGet = vi.fn().mockResolvedValue({ docs: opts.listDocs ?? [] });
  const orderBy = vi.fn(() => ({ get: listGet }));
  const collection = vi.fn(() => ({ orderBy, doc: vi.fn(() => docRef), add }));
  return { db: { collection } as unknown as ReturnType<typeof getAdminDb>, docRef, add };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('toCategory', () => {
  it('maps fields and converts timestamps to ISO', () => {
    expect(toCategory('c1', docData)).toEqual({
      id: 'c1',
      name: 'Tools',
      ownerId: 'owner-1',
      createdAt: '2026-01-02T03:04:05.000Z',
      updatedAt: '2026-01-02T03:04:05.000Z',
    });
  });

  it('tolerates missing timestamps', () => {
    const category = toCategory('c1', { ...docData, createdAt: undefined, updatedAt: null });
    expect(category.createdAt).toBeNull();
    expect(category.updatedAt).toBeNull();
  });
});

describe('categoryRepository.list', () => {
  it('maps every category, ordered by name', async () => {
    mockGetAdminDb.mockReturnValue(
      makeDb({ listDocs: [fakeDoc('c1', docData), fakeDoc('c2', { ...docData, name: 'Widgets' })] })
        .db,
    );
    const categories = await categoryRepository.list();
    expect(categories.map((c) => c.id)).toEqual(['c1', 'c2']);
  });
});

describe('categoryRepository.getById', () => {
  it('returns the category when it exists', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ getDoc: fakeDoc('c1', docData) }).db);
    await expect(categoryRepository.getById('c1')).resolves.toMatchObject({ id: 'c1' });
  });

  it('returns null when the document is missing', async () => {
    mockGetAdminDb.mockReturnValue(makeDb({ getDoc: fakeDoc('missing', null) }).db);
    await expect(categoryRepository.getById('missing')).resolves.toBeNull();
  });
});

describe('categoryRepository.create', () => {
  it('writes ownerId + timestamps and returns the created category', async () => {
    const mk = makeDb({ getDoc: fakeDoc('new', docData) });
    mockGetAdminDb.mockReturnValue(mk.db);
    const result = await categoryRepository.create({ name: 'Tools' }, 'owner-1');
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

describe('categoryRepository.update', () => {
  it('returns null and does not write when the category is missing', async () => {
    const mk = makeDb({ getDoc: fakeDoc('missing', null) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(categoryRepository.update('missing', { name: 'X' })).resolves.toBeNull();
    expect(mk.docRef.update).not.toHaveBeenCalled();
  });

  it('updates and returns the category when it exists', async () => {
    const mk = makeDb({ getDoc: fakeDoc('c1', docData) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(categoryRepository.update('c1', { name: 'Gear' })).resolves.toMatchObject({
      id: 'c1',
    });
    expect(mk.docRef.update).toHaveBeenCalledOnce();
  });
});

describe('categoryRepository.remove', () => {
  it('returns false and does not delete when the category is missing', async () => {
    const mk = makeDb({ getDoc: fakeDoc('missing', null) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(categoryRepository.remove('missing')).resolves.toBe(false);
    expect(mk.docRef.delete).not.toHaveBeenCalled();
  });

  it('deletes and returns true when the category exists', async () => {
    const mk = makeDb({ getDoc: fakeDoc('c1', docData) });
    mockGetAdminDb.mockReturnValue(mk.db);
    await expect(categoryRepository.remove('c1')).resolves.toBe(true);
    expect(mk.docRef.delete).toHaveBeenCalledOnce();
  });
});
