'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DeleteDialog } from '@/components/products/delete-dialog';
import { FilterBar, type SortKey, type StatusFilter } from '@/components/products/filter-bar';
import { MetricCards } from '@/components/products/metric-cards';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { ProductTable } from '@/components/products/product-table';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/use-products';
import type { Role } from '@/lib/auth/roles';
import type { Product } from '@/lib/types/product';

function filterByStatus(products: Product[], status: StatusFilter): Product[] {
  return status === 'all' ? products : products.filter((p) => p.status === status);
}

function sortProducts(products: Product[], sort: SortKey): Product[] {
  const copy = [...products];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'priceLow':
      return copy.sort((a, b) => a.price - b.price);
    case 'priceHigh':
      return copy.sort((a, b) => b.price - a.price);
    default:
      return copy.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }
}

export function Dashboard({ role }: { role: Role }) {
  const t = useTranslations('dashboard');
  const { data: products, isLoading, isError } = useProducts();
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [formTarget, setFormTarget] = useState<Product | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const canManage = role === 'admin';

  const visible = useMemo(
    () => sortProducts(filterByStatus(products ?? [], status), sort),
    [products, status, sort],
  );

  if (isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }
  if (isError) {
    return <p className="text-destructive">{t('error')}</p>;
  }

  return (
    <div className="space-y-6">
      <MetricCards products={products ?? []} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar status={status} onStatusChange={setStatus} sort={sort} onSortChange={setSort} />
        {canManage ? <Button onClick={() => setFormTarget('new')}>{t('newProduct')}</Button> : null}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border p-8 text-center">{t('empty')}</p>
      ) : (
        <ProductTable
          products={visible}
          canManage={canManage}
          onEdit={setFormTarget}
          onDelete={setDeleteTarget}
        />
      )}

      {formTarget ? (
        <ProductFormDialog target={formTarget} onClose={() => setFormTarget(null)} />
      ) : null}
      {deleteTarget ? (
        <DeleteDialog product={deleteTarget} onClose={() => setDeleteTarget(null)} />
      ) : null}
    </div>
  );
}
