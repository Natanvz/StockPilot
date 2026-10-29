'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  CategoryFormDialog,
  type CategoryFormTarget,
} from '@/components/categories/category-form-dialog';
import { CategoryTable } from '@/components/categories/category-table';
import { DeleteCategoryDialog } from '@/components/categories/delete-category-dialog';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import type { Category } from '@/lib/types/category';

function CategoryResults(props: {
  query: ReturnType<typeof useCategories>;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const t = useTranslations('categories');
  if (props.query.isLoading) return <p className="text-muted-foreground">{t('loading')}</p>;
  if (props.query.isError) return <p className="text-destructive">{t('error')}</p>;
  const rows = props.query.data ?? [];
  if (rows.length === 0) {
    return <p className="text-muted-foreground rounded-lg border p-8 text-center">{t('empty')}</p>;
  }
  return <CategoryTable categories={rows} onEdit={props.onEdit} onDelete={props.onDelete} />;
}

export function CategoryManager() {
  const t = useTranslations('categories');
  const query = useCategories();
  const [formTarget, setFormTarget] = useState<CategoryFormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setFormTarget({ mode: 'create' })}>{t('newCategory')}</Button>
      </div>
      <CategoryResults
        query={query}
        onEdit={(category) => setFormTarget({ mode: 'edit', category })}
        onDelete={setDeleteTarget}
      />
      {formTarget ? (
        <CategoryFormDialog target={formTarget} onClose={() => setFormTarget(null)} />
      ) : null}
      {deleteTarget ? (
        <DeleteCategoryDialog category={deleteTarget} onClose={() => setDeleteTarget(null)} />
      ) : null}
    </div>
  );
}
