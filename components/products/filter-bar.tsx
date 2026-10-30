'use client';

import { useTranslations } from 'next-intl';
import { useCategories } from '@/hooks/use-categories';
import {
  ALL_CATEGORIES,
  type CategoryFilter,
  type SortKey,
  type StatusFilter,
} from '@/lib/types/product';

type Props = {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  categoryId: CategoryFilter;
  onCategoryChange: (categoryId: CategoryFilter) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
  /** Hidden during search, which is relevance-ranked (ADR 0018). */
  showSort?: boolean;
};

const selectClass =
  'border-input bg-background focus-visible:ring-ring h-9 cursor-pointer rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none';

export function FilterBar({
  status,
  onStatusChange,
  categoryId,
  onCategoryChange,
  sort,
  onSortChange,
  showSort = true,
}: Props) {
  const t = useTranslations('dashboard');
  const categories = useCategories();

  return (
    <div className="flex flex-wrap gap-4">
      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('filterStatus')}</span>
        <select
          className={selectClass}
          value={status}
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
        >
          <option value="all">{t('filterAll')}</option>
          <option value="active">{t('status_active')}</option>
          <option value="inactive">{t('status_inactive')}</option>
        </select>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('filterCategory')}</span>
        <select
          className={selectClass}
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value={ALL_CATEGORIES}>{t('filterAll')}</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      {showSort ? (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t('sortBy')}</span>
          <select
            className={selectClass}
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortKey)}
          >
            <option value="newest">{t('sortNewest')}</option>
            <option value="name">{t('sortName')}</option>
            <option value="priceLow">{t('sortPriceLow')}</option>
            <option value="priceHigh">{t('sortPriceHigh')}</option>
          </select>
        </label>
      ) : null}
    </div>
  );
}
