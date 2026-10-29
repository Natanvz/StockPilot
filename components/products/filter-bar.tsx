'use client';

import { useTranslations } from 'next-intl';

export type StatusFilter = 'all' | 'active' | 'inactive';
export type SortKey = 'newest' | 'name' | 'priceLow' | 'priceHigh';

type Props = {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  sort: SortKey;
  onSortChange: (sort: SortKey) => void;
};

const selectClass =
  'border-input bg-background focus-visible:ring-ring h-9 cursor-pointer rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none';

export function FilterBar({ status, onStatusChange, sort, onSortChange }: Props) {
  const t = useTranslations('dashboard');

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
    </div>
  );
}
