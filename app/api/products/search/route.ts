import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/api/respond';
import { requireUser } from '@/lib/auth/guards';
import { isSearchEnabled, search } from '@/lib/search/product-index';
import { ALL_CATEGORIES, type StatusFilter } from '@/lib/types/product';

function parseStatus(value: string | null): StatusFilter {
  return value === 'active' || value === 'inactive' ? value : 'all';
}

/**
 * Full-text product search (ADR 0018). Returns Meilisearch results with the same
 * status/category filters the list uses. 503 when search is disabled (the client
 * hides the box then); 502 when enabled but the engine is unreachable (the client
 * shows an "unavailable" notice and falls back to the list).
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    await requireUser();
    if (!isSearchEnabled()) {
      return NextResponse.json({ error: 'Search disabled' }, { status: 503 });
    }
    const params = new URL(request.url).searchParams;
    const result = await search({
      query: params.get('q') ?? '',
      status: parseStatus(params.get('status')),
      categoryId: params.get('categoryId') ?? ALL_CATEGORIES,
      page: Math.max(1, Number(params.get('page')) || 1),
    });
    if (!result) {
      return NextResponse.json({ error: 'Search unavailable' }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
