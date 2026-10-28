'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useDeleteProduct } from '@/hooks/use-products';
import type { Product } from '@/lib/types/product';

export function DeleteDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useTranslations('dashboard');
  const remove = useDeleteProduct();

  async function onConfirm(): Promise<void> {
    await remove.mutateAsync(product.id);
    onClose();
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
          {t('deleteConfirm', { name: product.name })}
        </DialogDescription>
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
