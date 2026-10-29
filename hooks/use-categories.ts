'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories-client';
import type { UpdateCategoryInput } from '@/lib/validation/category';

const CATEGORIES_KEY = ['categories'] as const;
const PRODUCTS_KEY = ['products'] as const;

/** The full category list (a small, bounded admin-managed set). */
export function useCategories() {
  return useQuery({ queryKey: CATEGORIES_KEY, queryFn: categoriesApi.list });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  // Also refresh products: a rename updates their denormalized category name, and
  // any category change alters the filter/select options (ADR 0016).
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY }),
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }),
    ]);
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({ mutationFn: categoriesApi.create, onSuccess: invalidate });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      categoriesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({ mutationFn: categoriesApi.remove, onSuccess: invalidate });
}
