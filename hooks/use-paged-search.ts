'use client';

import { useState } from 'react';
import { useProductSearch } from '@/hooks/use-product-search';
import type { CategoryFilter, StatusFilter } from '@/lib/types/product';

/**
 * Full-text search with simple page navigation (ADR 0018). Page resets to 1 when
 * the query or the status/category filters change. Meilisearch ranks by relevance,
 * so there's no sort — just Prev/Next over its finite pagination.
 */
export function usePagedSearch(args: {
  query: string;
  status: StatusFilter;
  categoryId: CategoryFilter;
  enabled: boolean;
}) {
  const [page, setPage] = useState(1);
  // Reset to page 1 when the query/filters change — adjusted during render (the
  // React-recommended pattern), not in an effect.
  const inputKey = `${args.query}\u0000${args.status}\u0000${args.categoryId}`;
  const [prevKey, setPrevKey] = useState(inputKey);
  if (inputKey !== prevKey) {
    setPrevKey(inputKey);
    setPage(1);
  }

  const result = useProductSearch(
    { q: args.query, status: args.status, categoryId: args.categoryId, page },
    args.enabled,
  );
  const totalPages = result.data?.totalPages ?? 1;

  return {
    result,
    products: result.data?.products ?? [],
    page,
    totalPages,
    total: result.data?.total ?? 0,
    canPrev: page > 1,
    canNext: page < totalPages,
    goPrev: () => setPage((current) => Math.max(1, current - 1)),
    goNext: () => setPage((current) => current + 1),
  };
}

export type PagedSearch = ReturnType<typeof usePagedSearch>;
