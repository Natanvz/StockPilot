'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useDeleteCategory } from '@/hooks/use-categories';
import { CATEGORY_IN_USE } from '@/lib/api/categories-client';
import type { Category } from '@/lib/types/category';

export function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: Category;
  onClose: () => void;
}) {
  const t = useTranslations('categories');
  const remove = useDeleteCategory();
  const [error, setError] = useState<string | null>(null);

  async function onConfirm(): Promise<void> {
    try {
      await remove.mutateAsync(category.id);
      onClose();
    } catch (caught) {
      // A category still referenced by products is blocked server-side (409, ADR 0016).
      setError(caught instanceof Error && caught.message === CATEGORY_IN_USE ? 'inUse' : 'generic');
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent closeLabel={t('cancel')}>
        <DialogTitle>{t('deleteTitle')}</DialogTitle>
        <DialogDescription className="mt-2">
          {t('deleteConfirm', { name: category.name })}
        </DialogDescription>
        {error ? (
          <p className="text-destructive mt-3 text-sm">
            {error === 'inUse' ? t('deleteInUse') : t('deleteError')}
          </p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={onConfirm}>
            {t('delete')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
