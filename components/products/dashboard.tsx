'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { DeleteDialog } from '@/components/products/delete-dialog';
import { FilterBar } from '@/components/products/filter-bar';
import { MetricCards } from '@/components/products/metric-cards';
import { Pagination } from '@/components/products/pagination';
import { ProductFormDialog, type FormTarget } from '@/components/products/product-form-dialog';
import { ProductTable } from '@/components/products/product-table';
import { SearchBox } from '@/components/products/search-box';
import { SearchResults } from '@/components/products/search-results';
import { Button } from '@/components/ui/button';
import { usePagedProducts } from '@/hooks/use-paged-products';
import { usePagedSearch, type PagedSearch } from '@/hooks/use-paged-search';
import { useProducts, useProductStats } from '@/hooks/use-products';
import { ROLE, type Role } from '@/lib/auth/roles';
import { searchUiEnabled } from '@/lib/search/enabled';
import type { CategoryFilter, Product, SortKey, StatusFilter } from '@/lib/types/product';

type ProductsQuery = ReturnType<typeof useProducts>;
type PagedProducts = ReturnType<typeof usePagedProducts>;

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
  searchEnabled: boolean;
  query: string;
  onQueryChange: (query: string) => void;
  showSort: boolean;
  canManage: boolean;
  onNew: () => void;
}) {
  const t = useTranslations('dashboard');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <FilterBar
          status={props.status}
          onStatusChange={props.onStatusChange}
          categoryId={props.categoryId}
          onCategoryChange={props.onCategoryChange}
          sort={props.sort}
          onSortChange={props.onSortChange}
          showSort={props.showSort}
        />
        {props.searchEnabled ? (
          <SearchBox value={props.query} onChange={props.onQueryChange} />
        ) : null}
      </div>
      {props.canManage ? <Button onClick={props.onNew}>{t('newProduct')}</Button> : null}
    </div>
  );
}

function ResultsArea(props: {
  showSearch: boolean;
  searchFailed: boolean;
  search: PagedSearch;
  paged: PagedProducts;
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}) {
  const t = useTranslations('dashboard');
  if (props.showSearch) {
    return (
      <SearchResults
        search={props.search}
        canManage={props.canManage}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
      />
    );
  }
  return (
    <div className="space-y-6">
      {props.searchFailed ? (
        <p className="text-destructive text-sm">{t('searchUnavailable')}</p>
      ) : null}
      <ProductResults
        query={props.paged.query}
        canManage={props.canManage}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
      />
      <Pagination
        page={props.paged.page}
        totalPages={props.paged.totalPages}
        total={props.paged.total}
        pageSize={props.paged.pageSize}
        canPrev={props.paged.canPrev}
        canNext={props.paged.canNext}
        onPrev={props.paged.goPrev}
        onNext={props.paged.goNext}
        onPageSizeChange={props.paged.setPageSize}
      />
    </div>
  );
}

export function Dashboard({ role }: { role: Role }) {
  const paged = usePagedProducts();
  const stats = useProductStats();
  const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [query, setQuery] = useState('');
  const canManage = role === ROLE.ADMIN;

  const searchEnabled = searchUiEnabled();
  const searching = searchEnabled && query.trim().length > 0;
  const search = usePagedSearch({
    query,
    status: paged.status,
    categoryId: paged.categoryId,
    enabled: searching,
  });
  const searchFailed = searching && search.result.isError;
  const showSearch = searching && !searchFailed;

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
        searchEnabled={searchEnabled}
        query={query}
        onQueryChange={setQuery}
        showSort={!searching}
        canManage={canManage}
        onNew={() => setFormTarget({ mode: 'create' })}
      />
      <ResultsArea
        showSearch={showSearch}
        searchFailed={searchFailed}
        search={search}
        paged={paged}
        canManage={canManage}
        onEdit={(product) => setFormTarget({ mode: 'edit', product })}
        onDelete={setDeleteTarget}
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
