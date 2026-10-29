'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { Category } from '@/lib/types/category';

type Props = {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryTable({ categories, onEdit, onDelete }: Props) {
  const t = useTranslations('categories');
  const headClass = 'px-4 py-2 font-medium';

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th scope="col" className={headClass}>
              {t('colName')}
            </th>
            <th scope="col" className={`${headClass} text-right`}>
              {t('colActions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-t">
              <td className="px-4 py-2 font-medium">{category.name}</td>
              <td className="space-x-1 px-4 py-2 text-right whitespace-nowrap">
                <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
                  {t('edit')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(category)}>
                  {t('delete')}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
