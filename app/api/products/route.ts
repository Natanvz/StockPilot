import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireRole, requireUser } from '@/lib/auth/guards';
import { ROLE } from '@/lib/auth/roles';
import { categoryRepository } from '@/lib/data/category-repository';
import { DEFAULT_PAGE_SIZE, productRepository } from '@/lib/data/product-repository';
import { indexProduct } from '@/lib/search/product-index';
import { ALL_CATEGORIES, type SortKey, type StatusFilter } from '@/lib/types/product';
import { createProductSchema } from '@/lib/validation/product';

const SORT_KEYS: readonly string[] = ['newest', 'name', 'priceLow', 'priceHigh'];

function parseStatus(value: string | null): StatusFilter {
  return value === 'active' || value === 'inactive' ? value : 'all';
}

function parseSort(value: string | null): SortKey {
  return SORT_KEYS.includes(value ?? '') ? (value as SortKey) : 'newest';
}

/** List products — one cursor page, filtered + sorted server-side (any user). ADR 0015. */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireUser();
    const params = new URL(request.url).searchParams;
    const limit = Math.min(Number(params.get('limit')) || DEFAULT_PAGE_SIZE, 100);
    const status = parseStatus(params.get('status'));
    const categoryId = params.get('categoryId') ?? ALL_CATEGORIES;
    const sort = parseSort(params.get('sort'));
    const cursorValue = params.get('cursorValue');
    const cursorId = params.get('cursorId');
    const cursor = cursorValue !== null && cursorId ? { value: cursorValue, id: cursorId } : null;

    const [page, total] = await Promise.all([
      productRepository.list({ limit, cursor, status, categoryId, sort }),
      productRepository.count({ status, categoryId }),
    ]);
    return NextResponse.json({ ...page, total });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Create a product (admin only). */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const user = await requireRole(ROLE.ADMIN);
    const body: unknown = await request.json().catch(() => null);
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid product', issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const category = await categoryRepository.getById(parsed.data.categoryId);
    if (!category) {
      return NextResponse.json({ error: 'Unknown category' }, { status: 400 });
    }
    const product = await productRepository.create(
      { ...parsed.data, category: category.name },
      user.uid,
    );
    await indexProduct(product); // best-effort search sync (ADR 0018)
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
