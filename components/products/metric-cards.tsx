'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/format';
import type { ProductStats } from '@/lib/types/product';

/**
 * Summary metrics from the stats endpoint (ADR 0006) — computed server-side with
 * aggregation queries, so they stay accurate even though the list is paginated.
 */
export function MetricCards({ stats }: { stats?: ProductStats }) {
  const t = useTranslations('dashboard');
  const metrics = [
    { label: t('metricTotal'), value: stats ? String(stats.total) : '—' },
    { label: t('metricActive'), value: stats ? String(stats.activeCount) : '—' },
    { label: t('metricValue'), value: stats ? formatPrice(stats.activeValueCents) : '—' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.label}>
          <p className="text-muted-foreground text-sm">{metric.label}</p>
          <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
        </Card>
      ))}
    </div>
  );
}
