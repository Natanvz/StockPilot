'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

/**
 * Debounced search input. Keeps the typed value responsive locally and reports it
 * to the parent 300ms after typing stops, so each keystroke doesn't fire a query.
 */
export function SearchBox({
  value,
  onChange,
}: {
  value: string;
  onChange: (query: string) => void;
}) {
  const t = useTranslations('dashboard');
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(id);
  }, [local, onChange]);

  return (
    <input
      type="search"
      value={local}
      onChange={(event) => setLocal(event.target.value)}
      placeholder={t('searchPlaceholder')}
      aria-label={t('searchPlaceholder')}
      className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none sm:w-64"
    />
  );
}
