'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DeleteDialog } from '@/components/products/delete-dialog';
import { FilterBar } from '@/components/products/filter-bar';
import { MetricCards } from '@/components/products/metric-cards';
import { Pagination } from '@/components/products/pagination';
import { ProductFormDialog, type FormTarget } from '@/components/products/product-form-dialog';
import { ProductTable } from '@/components/products/product-table';
import { Button } from '@/components/ui/button';
import { usePagedProducts } from '@/hooks/use-paged-products';
import { useProducts, useProductStats } from '@/hooks/use-products';
import { ROLE, type Role } from '@/lib/auth/roles';
import type { CategoryFilter, Product, SortKey, StatusFilter } from '@/lib/types/product';

type ProductsQuery = ReturnType<typeof useProducts>;

function ProductResults(props: {
  query: ProductsQuery;
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const t = useTranslations('dashboard');
  if (props.query.isLoading) return <p className="text-muted-foreground">{t('loading')}</p>;
  if (props.query.isError) return <p className="text-destructive">{t('error')}</p>;
  const rows = props.query.data?.products ?? [];
  if (rows.length === 0) {
    return <p className="text-muted-foreground rounded-lg border p-8 text-center">{t('empty')}</p>;
  }
  return (
    <ProductTable
      products={rows}
      canManage={props.canManage}
      onEdit={props.onEdit}
      onDelete={props.onDelete}
    />
  );
}

function DashboardToolbar(props: {
  status: StatusFilter;
  categoryId: CategoryFilter;
  sort: SortKey;
  onStatusChange: (status: StatusFilter) => void;
  onCategoryChange: (categoryId: CategoryFilter) => void;
  onSortChange: (sort: SortKey) => void;
  canManage: boolean;
  onNew: () => void;
}) {
  const t = useTranslations('dashboard');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <FilterBar
        status={props.status}
        onStatusChange={props.onStatusChange}
        categoryId={props.categoryId}
        onCategoryChange={props.onCategoryChange}
        sort={props.sort}
        onSortChange={props.onSortChange}
      />
      {props.canManage ? <Button onClick={props.onNew}>{t('newProduct')}</Button> : null}
    </div>
  );
}

export function Dashboard({ role }: { role: Role }) {
  const paged = usePagedProducts();
  const stats = useProductStats();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const canManage = role === ROLE.ADMIN;

  return (
    <div className="space-y-6">
      <MetricCards stats={stats.data} />
      <DashboardToolbar
        status={paged.status}
        categoryId={paged.categoryId}
        sort={paged.sort}
        onStatusChange={paged.setStatus}
        onCategoryChange={paged.setCategory}
        onSortChange={paged.setSort}
        canManage={canManage}
        onNew={() => setFormTarget({ mode: 'create' })}
      />
      <ProductResults
        query={paged.query}
        canManage={canManage}
        onEdit={(product) => setFormTarget({ mode: 'edit', product })}
        onDelete={setDeleteTarget}
      />
      <Pagination
        page={paged.page}
        totalPages={paged.totalPages}
        total={paged.total}
        pageSize={paged.pageSize}
        canPrev={paged.canPrev}
        canNext={paged.canNext}
        onPrev={paged.goPrev}
        onNext={paged.goNext}
        onPageSizeChange={paged.setPageSize}
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
