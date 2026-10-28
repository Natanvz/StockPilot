'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products-client';
import type { UpdateProductInput } from '@/lib/validation/product';

const PRODUCTS_KEY = ['products'] as const;

/** Fetch the product list (TanStack Query owns caching + loading/error — ADR 0013). */
export function useProducts() {
  return useQuery({ queryKey: PRODUCTS_KEY, queryFn: productsApi.list });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY });
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
