'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCategory, useUpdateCategory } from '@/hooks/use-categories';
import type { Category } from '@/lib/types/category';
import { createCategorySchema, type CreateCategoryInput } from '@/lib/validation/category';

/** What the form is doing — create, or edit a specific category. */
export type CategoryFormTarget = { mode: 'create' } | { mode: 'edit'; category: Category };

export function CategoryFormDialog({
  target,
  onClose,
}: {
  target: CategoryFormTarget;
  onClose: () => void;
}) {
  const t = useTranslations('categories');
  const category = target.mode === 'edit' ? target.category : null;
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: category?.name ?? '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    await (category
      ? update.mutateAsync({ id: category.id, input: values })
      : create.mutateAsync(values));
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent closeLabel={t('cancel')}>
        <DialogTitle>{category ? t('editCategory') : t('newCategory')}</DialogTitle>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('colName')}</Label>
            <Input id="name" {...register('name')} />
            {errors.name ? <p className="text-destructive text-sm">{t('fieldRequired')}</p> : null}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
