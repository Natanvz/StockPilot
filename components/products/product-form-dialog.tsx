'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateProduct, useUpdateProduct } from '@/hooks/use-products';
import type { Product } from '@/lib/types/product';
import { PRODUCT_STATUSES } from '@/lib/validation/product';

const formSchema = z.object({
  name: z.string().trim().min(1).max(100),
  category: z.string().trim().min(1).max(60),
  priceDollars: z.number().nonnegative(),
  status: z.enum(PRODUCT_STATUSES),
});
type FormValues = z.infer<typeof formSchema>;

const selectClass =
  'border-input bg-background h-10 w-full cursor-pointer rounded-md border px-3 text-sm focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none';

function toDefaults(product: Product | null): FormValues {
  if (!product) {
    return { name: '', category: '', priceDollars: 0, status: 'active' };
  }
  return {
    name: product.name,
    category: product.category,
    priceDollars: product.price / 100,
    status: product.status,
  };
}

/** What the form is doing — create, or edit a specific product. */
export type FormTarget = { mode: 'create' } | { mode: 'edit'; product: Product };

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
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: toDefaults(product),
  });

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      name: values.name,
      category: values.category,
      price: Math.round(values.priceDollars * 100),
      status: values.status,
    };
    await (product ? update.mutateAsync({ id: product.id, input }) : create.mutateAsync(input));
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
        <DialogTitle>{product ? t('editProduct') : t('newProduct')}</DialogTitle>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t('colName')}</Label>
            <Input id="name" {...register('name')} />
            {errors.name ? <p className="text-destructive text-sm">{t('fieldRequired')}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">{t('colCategory')}</Label>
            <Input id="category" {...register('category')} />
            {errors.category ? (
              <p className="text-destructive text-sm">{t('fieldRequired')}</p>
            ) : null}
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
            {errors.priceDollars ? (
              <p className="text-destructive text-sm">{t('fieldRequired')}</p>
            ) : null}
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
            <Button type="submit" disabled={isSubmitting}>
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
