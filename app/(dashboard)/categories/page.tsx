import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { CategoryManager } from '@/components/categories/category-manager';
import { ROLE } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/auth/session';

/** Admin-only category management (ADR 0016). Viewers are redirected; the API enforces too. */
export default async function CategoriesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/sign-in');
  }
  if (user.role !== ROLE.ADMIN) {
    redirect('/dashboard');
  }

  const t = await getTranslations('categories');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
            {t('backToDashboard')}
          </Link>
        </div>
        <SignOutButton />
      </div>
      <CategoryManager />
    </main>
  );
}
