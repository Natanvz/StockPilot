'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products-client';
import type { ProductCursor } from '@/lib/types/product';
import type { UpdateProductInput } from '@/lib/validation/product';

const PRODUCTS_KEY = ['products'] as const;
const STATS_KEY = ['product-stats'] as const;

/** Paginated product list (TanStack infinite query; cursor-based — ADR 0006). */
export function useProducts() {
  return useInfiniteQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: ({ pageParam }) => productsApi.list(pageParam),
    initialPageParam: null as ProductCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}

/** Catalog metrics (separate from the paged list so totals stay accurate). */
export function useProductStats() {
  return useQuery({ queryKey: STATS_KEY, queryFn: productsApi.stats });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
      queryClient.invalidateQueries({ queryKey: STATS_KEY }),
    ]);
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: productsApi.create, onSuccess: invalidate });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateProductInput }) =>
      productsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: productsApi.remove, onSuccess: invalidate });
}
