'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { productsApi, type ProductSearchQuery } from '@/lib/api/products-client';

const SEARCH_KEY = ['product-search'] as const;

/**
 * One page of full-text search results (ADR 0018). Disabled (no request) until
 * search is enabled and the query is non-empty. `retry: false` so an unreachable
 * engine surfaces as an error immediately — the dashboard then shows the
 * "unavailable" notice and falls back to the list.
 */
export function useProductSearch(params: ProductSearchQuery, enabled: boolean) {
  return useQuery({
    queryKey: [...SEARCH_KEY, params],
    queryFn: () => productsApi.search(params),
    enabled: enabled && params.q.trim().length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });
}
