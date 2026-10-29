'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/use-categories';
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';
import type { Category } from '@/lib/types/category';
import type { Product } from '@/lib/types/product';
import { PRODUCT_STATUSES } from '@/lib/validation/product';

const formSchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryId: z.string().trim().min(1),
  priceDollars: z.number().nonnegative(),
  status: z.enum(PRODUCT_STATUSES),
});
type FormValues = z.infer<typeof formSchema>;

const selectClass =
  'border-input bg-background h-10 w-full cursor-pointer rounded-md border px-3 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

function toDefaults(product: Product | null, categories: Category[]): FormValues {
  return {
    name: product?.name ?? '',
    categoryId: product?.categoryId ?? categories[0]?.id ?? '',
    priceDollars: product ? product.price / 100 : 0,
    status: product?.status ?? 'active',
  };
}

/** What the form is doing — create, or edit a specific product. */
export type FormTarget = { mode: 'create' } | { mode: 'edit'; product: Product };

function FieldError({ show, message }: { show: boolean; message: string }) {
  return show ? <p className="text-destructive text-sm">{message}</p> : null;
}

// eslint-disable-next-line max-lines-per-function -- one cohesive form; splitting the fields would scatter it
export function ProductFormDialog({
  target,
  onClose,
}: {
  target: FormTarget;
  onClose: () => void;
}) {
  const t = useTranslations('dashboard');
  const product = target.mode === 'edit' ? target.product : null;
  const categories = useCategories();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaults(product, categories.data ?? []),
  });

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      categoryId: values.categoryId,
      price: Math.round(values.priceDollars * 100),
      status: values.status,
    };
    await (product ? update.mutateAsync({ id: product.id, input }) : create.mutateAsync(input));
    onClose();
  });

  const noCategories = !categories.isLoading && (categories.data?.length ?? 0) === 0;

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent closeLabel={t('cancel')}>
        <DialogTitle>{product ? t('editProduct') : t('newProduct')}</DialogTitle>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('colName')}</Label>
            <Input id="name" {...register('name')} />
            <FieldError show={Boolean(errors.name)} message={t('fieldRequired')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="categoryId">{t('colCategory')}</Label>
            <select id="categoryId" className={selectClass} {...register('categoryId')}>
              {(categories.data ?? []).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError show={noCategories} message={t('noCategories')} />
            <FieldError show={Boolean(errors.categoryId)} message={t('fieldRequired')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priceDollars">{t('priceLabel')}</Label>
            <Input
              id="priceDollars"
              type="number"
              step="0.01"
              min="0"
              {...register('priceDollars', { valueAsNumber: true })}
            />
            <FieldError show={Boolean(errors.priceDollars)} message={t('fieldRequired')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">{t('colStatus')}</Label>
            <select id="status" className={selectClass} {...register('status')}>
              <option value="active">{t('status_active')}</option>
              <option value="inactive">{t('status_inactive')}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || noCategories}>
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
