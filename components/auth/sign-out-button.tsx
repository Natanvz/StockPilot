'use client';

import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { getClientAuth } from '@/lib/firebase/client';

export function SignOutButton() {
  const t = useTranslations('auth');
  const router = useRouter();

  async function onSignOut(): Promise<void> {
    await fetch('/api/auth/session', { method: 'DELETE' });
    await signOut(getClientAuth()).catch(() => undefined);
    router.push('/sign-in');
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={onSignOut}>
      {t('signOut')}
    </Button>
  );
}
