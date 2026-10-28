'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { DeleteDialog } from '@/components/products/delete-dialog';
import { FilterBar, type SortKey, type StatusFilter } from '@/components/products/filter-bar';
import { MetricCards } from '@/components/products/metric-cards';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { ProductTable } from '@/components/products/product-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts, useProductStats } from '@/hooks/use-products';
import type { Role } from '@/lib/auth/roles';
import type { Product } from '@/lib/types/product';

function searchProducts(products: Product[], query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return products;
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
  );
}

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

type ToolbarProps = {
  search: string;
  onSearch: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
  canManage: boolean;
  onNew: () => void;
};

function DashboardToolbar(props: ToolbarProps) {
  const t = useTranslations('dashboard');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          className="h-9 w-56"
          placeholder={t('searchPlaceholder')}
          value={props.search}
          onChange={(event) => props.onSearch(event.target.value)}
        />
        <FilterBar
          status={props.status}
          onStatusChange={props.onStatusChange}
          sort={props.sort}
          onSortChange={props.onSortChange}
        />
      </div>
      {props.canManage ? <Button onClick={props.onNew}>{t('newProduct')}</Button> : null}
    </div>
  );
}

type ResultsProps = {
  products: Product[];
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  hasNextPage: boolean;
  isFetchingMore: boolean;
  onLoadMore: () => void;
};

function ProductResults(props: ResultsProps) {
  const t = useTranslations('dashboard');
  if (props.products.length === 0) {
    return <p className="text-muted-foreground rounded-lg border p-8 text-center">{t('empty')}</p>;
  }
  return (
    <div className="space-y-4">
      <ProductTable
        products={props.products}
        canManage={props.canManage}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
      />
      {props.hasNextPage ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={props.onLoadMore} disabled={props.isFetchingMore}>
            {t('loadMore')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function Dashboard({ role }: { role: Role }) {
  const t = useTranslations('dashboard');
  const products = useProducts();
  const stats = useProductStats();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [formTarget, setFormTarget] = useState<Product | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const canManage = role === 'admin';

  const loaded = useMemo(
    () => products.data?.pages.flatMap((page) => page.products) ?? [],
    [products.data],
  );
  const visible = useMemo(
    () => sortProducts(filterByStatus(searchProducts(loaded, search), status), sort),
    [loaded, search, status, sort],
  );

  if (products.isLoading) {
    return <p className="text-muted-foreground">{t('loading')}</p>;
  }
  if (products.isError) {
    return <p className="text-destructive">{t('error')}</p>;
  }

  return (
    <div className="space-y-6">
      <MetricCards stats={stats.data} />
      <DashboardToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        canManage={canManage}
        onNew={() => setFormTarget('new')}
      />
      <ProductResults
        products={visible}
        canManage={canManage}
        onEdit={setFormTarget}
        onDelete={setDeleteTarget}
        hasNextPage={products.hasNextPage ?? false}
        isFetchingMore={products.isFetchingNextPage}
        onLoadMore={() => products.fetchNextPage()}
      />
      {formTarget ? (
        <ProductFormDialog target={formTarget} onClose={() => setFormTarget(null)} />
      ) : null}
      {deleteTarget ? (
        <DeleteDialog product={deleteTarget} onClose={() => setDeleteTarget(null)} />
      ) : null}
    </div>
  );
}
