'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type Props = {
  page: number; // 1-based
  totalPages: number;
  total: number;
  pageSize: number;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPageSizeChange: (size: number) => void;
};

const PAGE_SIZES = [5, 10, 20, 50];

const selectClass =
  'border-input bg-background focus-visible:ring-ring h-9 cursor-pointer rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:outline-none';

/**
 * Cursor-based pager (ADR 0015): Prev/Next only (Firestore has no offset, so no
 * jump-to-arbitrary-page), plus page position, total count, and a page-size select.
 */
export function Pagination(props: Props) {
  const t = useTranslations('dashboard');

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="text-muted-foreground">
        {t('pageOf', { page: props.page, totalPages: props.totalPages })} ·{' '}
        {t('itemCount', { count: props.total })}
      </p>
      <div className="flex items-center gap-2">
        <label className="text-muted-foreground flex items-center gap-2">
          {t('perPage')}
          <select
            className={selectClass}
            value={props.pageSize}
            onChange={(event) => props.onPageSizeChange(Number(event.target.value))}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <Button variant="outline" size="sm" onClick={props.onPrev} disabled={!props.canPrev}>
          {t('prev')}
        </Button>
        <Button variant="outline" size="sm" onClick={props.onNext} disabled={!props.canNext}>
          {t('next')}
        </Button>
      </div>
    </div>
  );
}
