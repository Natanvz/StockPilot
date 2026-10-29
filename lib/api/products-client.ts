import type {
  Product,
  ProductListParams,
  ProductListResult,
  ProductStats,
} from '@/lib/types/product';
import type { CreateProductInput, UpdateProductInput } from '@/lib/validation/product';

/** Thin typed client over the products REST API (ADR 0013). Components call this, not raw fetch. */

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export const productsApi = {
  async list({
    status,
    categoryId,
    sort,
    limit,
    cursor,
  }: ProductListParams): Promise<ProductListResult> {
    const params = new URLSearchParams({ status, categoryId, sort, limit: String(limit) });
    if (cursor) {
      params.set('cursorValue', String(cursor.value));
      params.set('cursorId', cursor.id);
    }
    return parse<ProductListResult>(await fetch(`/api/products?${params.toString()}`));
  },

  async stats(): Promise<ProductStats> {
    const data = await parse<{ stats: ProductStats }>(await fetch('/api/products/stats'));
    return data.stats;
  },

  async create(input: CreateProductInput): Promise<Product> {
    const data = await parse<{ product: Product }>(
      await fetch('/api/products', {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      }),
    );
    return data.product;
  },

  async update(id: string, input: UpdateProductInput): Promise<Product> {
    const data = await parse<{ product: Product }>(
      await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify(input),
      }),
    );
    return data.product;
  },

  async remove(id: string): Promise<void> {
    await parse<{ ok: true }>(await fetch(`/api/products/${id}`, { method: 'DELETE' }));
  },
};
