import type { Category } from '@/lib/types/category';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/lib/validation/category';

/** Thin typed client over the categories REST API (ADR 0016). Components call this, not raw fetch. */

/** Thrown by `remove` when the server blocks the delete because products still use it (409). */
export const CATEGORY_IN_USE = 'CATEGORY_IN_USE';

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const data = await parse<{ categories: Category[] }>(await fetch('/api/categories'));
    return data.categories;
  },

  async create(input: CreateCategoryInput): Promise<Category> {
    const data = await parse<{ category: Category }>(
      await fetch('/api/categories', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      }),
    );
    return data.category;
  },

  async update(id: string, input: UpdateCategoryInput): Promise<Category> {
    const data = await parse<{ category: Category }>(
      await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      }),
    );
    return data.category;
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (res.status === 409) {
      throw new Error(CATEGORY_IN_USE);
    }
    await parse<{ ok: true }>(res);
  },
};
