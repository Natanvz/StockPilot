'use client';

import { useTranslations } from 'next-intl';
import { ProductTable } from '@/components/products/product-table';
import { Button } from '@/components/ui/button';
import type { PagedSearch } from '@/hooks/use-paged-search';
import type { Product } from '@/lib/types/product';

type Props = {
  search: PagedSearch;
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

/** Search-mode results: the matching products plus relevance-ordered Prev/Next. */
export function SearchResults({ search, canManage, onEdit, onDelete }: Props) {
  const t = useTranslations('dashboard');

  if (search.result.isLoading && search.products.length === 0) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }
  if (search.products.length === 0) {
    return (
      <p className="text-muted-foreground rounded-lg border p-8 text-center">{t('searchEmpty')}</p>
    );
  }

  return (
    <div className="space-y-4">
      <ProductTable
        products={search.products}
        canManage={canManage}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">
          {t('pageOf', { page: search.page, totalPages: search.totalPages })} ·{' '}
          {t('itemCount', { count: search.total })}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!search.canPrev} onClick={search.goPrev}>
            {t('prev')}
          </Button>
          <Button variant="outline" size="sm" disabled={!search.canNext} onClick={search.goNext}>
            {t('next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
