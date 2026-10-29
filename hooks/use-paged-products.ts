'use client';

import { useState } from 'react';
import { useProducts } from '@/hooks/use-products';
import type { ProductCursor, SortKey, StatusFilter } from '@/lib/types/product';

const DEFAULT_PAGE_SIZE = 5;

/**
 * Cursor-paged product list state (ADR 0015): holds the filter/sort/page-size and
 * a stack of the cursors that start each visited page, so Prev/Next work without
 * Firestore offsets. Changing filter/sort/size resets to page 1.
 */
export function usePagedProducts() {
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<(ProductCursor | null)[]>([null]);

  const query = useProducts({ status, sort, limit: pageSize, cursor: cursors[pageIndex] ?? null });
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const nextCursor = query.data?.nextCursor ?? null;

  function reset(apply: () => void) {
    apply();
    setPageIndex(0);
    setCursors([null]);
  }

  function goNext() {
    if (!nextCursor) return;
    setCursors((prev) => {
      const copy = prev.slice();
      copy[pageIndex + 1] = nextCursor;
      return copy;
    });
    setPageIndex((index) => index + 1);
  }

  return {
    query,
    status,
    sort,
    pageSize,
    page: pageIndex + 1,
    totalPages,
    total,
    canPrev: pageIndex > 0,
    canNext: pageIndex + 1 < totalPages,
    setStatus: (value: StatusFilter) => reset(() => setStatus(value)),
    setSort: (value: SortKey) => reset(() => setSort(value)),
    setPageSize: (value: number) => reset(() => setPageSize(value)),
    goPrev: () => setPageIndex((index) => Math.max(0, index - 1)),
    goNext,
  };
}
