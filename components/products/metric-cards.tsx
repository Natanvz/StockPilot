'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types/product';

/** Summary metrics (ADR 0006 notes these move to maintained counters at scale). */
export function MetricCards({ products }: { products: Product[] }) {
  const t = useTranslations('dashboard');
  const active = products.filter((p) => p.status === 'active');
  const value = active.reduce((sum, p) => sum + p.price, 0);

  const metrics = [
    { label: t('metricTotal'), value: String(products.length) },
    { label: t('metricActive'), value: String(active.length) },
    { label: t('metricValue'), value: formatPrice(value) },
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
