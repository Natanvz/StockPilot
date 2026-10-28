import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { getSessionUser } from '@/lib/auth/session';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/sign-in');
  }

  const t = await getTranslations('dashboard');

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <SignOutButton />
      </div>
      <div className="bg-card flex items-center gap-3 rounded-lg border p-4">
        <p className="text-muted-foreground text-sm">
          {t('signedInAs', { email: user.email ?? user.uid })}
        </p>
        <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-0.5 text-xs font-medium capitalize">
          {user.role}
        </span>
      </div>
    </main>
  );
}
