import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { Dashboard } from '@/components/products/dashboard';
import { Badge } from '@/components/ui/badge';
import { ROLE } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/auth/session';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/sign-in');
  }

  const t = await getTranslations('dashboard');

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <Badge>{user.role}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground hidden text-sm sm:block">
            {t('signedInAs', { email: user.email ?? user.uid })}
          </p>
          {user.role === ROLE.ADMIN ? (
            <Link href="/categories" className="text-sm font-medium hover:underline">
              {t('manageCategories')}
            </Link>
          ) : null}
          <SignOutButton />
        </div>
      </div>
      <Dashboard role={user.role} />
    </main>
  );
}
