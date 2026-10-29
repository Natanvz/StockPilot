'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import type { Product } from '@/lib/types/product';
import { STATUS } from '@/lib/validation/product';

type Props = {
  products: Product[];
  canManage: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
};

export function ProductTable({ products, canManage, onEdit, onDelete }: Props) {
  const t = useTranslations('dashboard');
  const headClass = 'px-4 py-2 font-medium';

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th scope="col" className={headClass}>
              {t('colName')}
            </th>
            <th scope="col" className={headClass}>
              {t('colCategory')}
            </th>
            <th scope="col" className={headClass}>
              {t('colPrice')}
            </th>
            <th scope="col" className={headClass}>
              {t('colStatus')}
            </th>
            {canManage ? (
              <th scope="col" className={`${headClass} text-right`}>
                {t('colActions')}
              </th>
            ) : null}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t">
              <td className="px-4 py-2 font-medium">{product.name}</td>
              <td className="text-muted-foreground px-4 py-2">{product.category}</td>
              <td className="px-4 py-2 tabular-nums">{formatPrice(product.price)}</td>
              <td className="px-4 py-2">
                <Badge tone={product.status === STATUS.ACTIVE ? 'success' : 'muted'}>
                  {t(`status_${product.status}`)}
                </Badge>
              </td>
              {canManage ? (
                <td className="space-x-1 px-4 py-2 text-right whitespace-nowrap">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(product)}>
                    {t('edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(product)}>
                    {t('delete')}
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
